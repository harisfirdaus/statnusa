const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface FetchBpsResult {
  success: boolean;
  data: unknown;
  resolvedUrl: string;
}

export interface CreateChartResult {
  success: boolean;
  chartId: string;
  editUrl: string;
  publicUrl: string;
  published: boolean;
}

async function apiFetch<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  const json = await res.json();
  if (!res.ok) {
    const msg = (json as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

export async function fetchBpsData(url: string): Promise<FetchBpsResult> {
  return apiFetch<FetchBpsResult>("/api/bps/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export async function getAuthStatus(): Promise<{ required: boolean }> {
  return apiFetch<{ required: boolean }>("/api/auth/status", { method: "GET" });
}

export async function verifyPassword(password: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${BASE}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const json = await res.json() as { ok: boolean };
  return json;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function* streamChat(
  messages: ChatMessage[],
  tableContext?: string
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, tableContext }),
  });

  if (!res.ok) {
    const json = await res.json() as { error?: string };
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {}
    }
  }
}

export async function createDatawrapperChart(payload: {
  title: string;
  chartType: string;
  csvData: string;
  description?: string;
  notes?: string;
  palette?: string[];
  sortBars?: boolean;
}): Promise<CreateChartResult> {
  return apiFetch<CreateChartResult>("/api/datawrapper/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
