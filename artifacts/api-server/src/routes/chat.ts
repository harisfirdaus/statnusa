import { Router } from "express";

const router = Router();

const MODELS = [
  "google/gemma-3n-e4b-it",
  "meta/llama-3.1-70b-instruct",
  "meta/llama-3.1-8b-instruct",
];

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

async function callNvidia(
  apiKey: string,
  model: string,
  messages: Message[],
  signal: AbortSignal
): Promise<Response> {
  const payload: Record<string, unknown> = {
    model,
    messages,
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 0.95,
    stream: true,
  };

  if (model.startsWith("google/gemma")) {
    payload.chat_template_kwargs = { enable_thinking: false };
  }

  return fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal,
  });
}

function isDegraded(status: number, body: string): boolean {
  return status === 400 && body.includes("DEGRADED");
}

router.post("/chat", async (req, res) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "NVIDIA_API_KEY tidak dikonfigurasi di server" });
  }

  const messages: Message[] = req.body?.messages;
  const tableContext: string | undefined = req.body?.tableContext;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Field 'messages' harus berupa array yang tidak kosong" });
  }

  const systemPrompt = tableContext
    ? [
        "Kamu adalah asisten analisis data statistik Indonesia.",
        "Bantu user memahami, menganalisis, dan menginterpretasi data dari Badan Pusat Statistik (BPS) Indonesia.",
        "Gunakan bahasa Indonesia yang jelas. Jika diminta analisis, berikan insight spesifik berdasarkan angka di data.",
        "Jika pertanyaan di luar konteks data, tetap jawab dengan sopan.",
        "",
        "Data yang sedang dianalisis:",
        tableContext,
      ].join("\n")
    : "Kamu adalah asisten analisis data statistik BPS Indonesia. Gunakan bahasa Indonesia.";

  const fullMessages: Message[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  let upstream: Response | null = null;
  let usedModel = MODELS[0];
  let lastError = "";

  for (const model of MODELS) {
    usedModel = model;
    try {
      const response = await callNvidia(
        apiKey,
        model,
        fullMessages,
        AbortSignal.timeout(60_000)
      );

      if (response.ok) {
        upstream = response;
        break;
      }

      const errText = await response.text();
      lastError = errText;

      if (isDegraded(response.status, errText)) {
        req.log.warn({ model, status: response.status }, "Model DEGRADED, mencoba fallback");
        continue;
      }

      if (response.status === 429) {
        req.log.warn({ model }, "Rate limited, mencoba fallback");
        continue;
      }

      req.log.error({ model, status: response.status, errText }, "NVIDIA API error");
      return res.status(response.status).json({
        error: `Model AI mengembalikan status ${response.status}`,
        details: errText.slice(0, 300),
      });
    } catch (err: any) {
      if (err.name === "TimeoutError") {
        req.log.warn({ model }, "Timeout, mencoba fallback");
        lastError = "timeout";
        continue;
      }
      if (!res.headersSent) {
        return res.status(500).json({ error: "Gagal menghubungi NVIDIA API", details: err.message });
      }
      return;
    }
  }

  if (!upstream) {
    return res.status(503).json({
      error: "Semua model AI sedang tidak tersedia (DEGRADED). Coba beberapa saat lagi.",
      details: lastError.slice(0, 300),
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Model-Used", usedModel);
  res.flushHeaders();

  try {
    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch {
    res.end();
  }
});

export default router;
