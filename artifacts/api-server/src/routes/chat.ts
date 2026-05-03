import { Router } from "express";

const router = Router();

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
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

  const payload = {
    model: "google/gemma-3-27b-it",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_tokens: 2048,
    temperature: 0.7,
    top_p: 0.95,
    stream: true,
  };

  try {
    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      req.log.error({ status: upstream.status, errText }, "NVIDIA API error");
      return res.status(upstream.status).json({
        error: `NVIDIA API mengembalikan status ${upstream.status}`,
        details: errText.slice(0, 300),
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (err: any) {
    if (res.headersSent) { res.end(); return; }
    if (err.name === "TimeoutError") {
      return res.status(504).json({ error: "Timeout menghubungi NVIDIA API (>60 detik)" });
    }
    req.log.error({ err }, "Chat error");
    return res.status(500).json({ error: "Gagal menghubungi NVIDIA API", details: err.message });
  }
});

export default router;
