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
