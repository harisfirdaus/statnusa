export const config = { runtime: "edge" };

const MODELS = [
  "google/gemma-3-27b-it",
  "meta/llama-3.1-70b-instruct",
  "meta/llama-3.1-8b-instruct",
];

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

function isDegraded(status: number, body: string): boolean {
  return status === 400 && body.includes("DEGRADED");
}

async function callNvidia(
  apiKey: string,
  model: string,
  messages: Message[],
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
    signal: AbortSignal.timeout(60_000),
  });
}

function errorResponse(status: number, message: string, details?: string): Response {
  return new Response(
    JSON.stringify({ error: message, ...(details ? { details } : {}) }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return errorResponse(405, "Method not allowed");
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return errorResponse(500, "NVIDIA_API_KEY tidak dikonfigurasi di server");
  }

  let body: { messages?: Message[]; tableContext?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return errorResponse(400, "Request body tidak valid");
  }

  const { messages, tableContext } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return errorResponse(400, "Field 'messages' harus berupa array yang tidak kosong");
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
      const response = await callNvidia(apiKey, model, fullMessages);

      if (response.ok) {
        upstream = response;
        break;
      }

      const errText = await response.text();
      lastError = errText;

      if (isDegraded(response.status, errText) || response.status === 429) {
        continue;
      }

      return errorResponse(response.status, `Model AI mengembalikan status ${response.status}`, errText.slice(0, 300));
    } catch (err: any) {
      if (err.name === "TimeoutError") {
        lastError = "timeout";
        continue;
      }
      return errorResponse(500, "Gagal menghubungi NVIDIA API", err.message);
    }
  }

  if (!upstream) {
    return errorResponse(503, "Semua model AI sedang tidak tersedia (DEGRADED). Coba beberapa saat lagi.", lastError.slice(0, 300));
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Model-Used": usedModel,
    },
  });
}
