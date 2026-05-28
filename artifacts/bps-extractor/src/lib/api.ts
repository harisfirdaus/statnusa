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
  // Step 1: minta server untuk inject API key ke URL
  const { resolvedUrl } = await apiFetch<{ success: boolean; resolvedUrl: string }>("/api/bps/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  // Step 2: fetch langsung ke BPS API dari browser
  // Ini menghindari blokir Cloudflare pada IP serverless/datacenter
  const response = await fetch(resolvedUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`BPS API mengembalikan status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Respons bukan JSON: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  if ((data as any)["data-availability"] === "not-available") {
    throw new Error("Data tidak tersedia untuk URL yang diberikan");
  }

  return { success: true, data, resolvedUrl };
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
    const text = await res.text();
    let msg = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as { error?: string };
      msg = json.error ?? msg;
    } catch {
      if (text.trim()) msg = text.trim().slice(0, 200);
    }
    throw new Error(msg);
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
