function injectApiKey(rawUrl: string, apiKey: string): string {
  const url = rawUrl.trim();

  if (url.includes("WebAPI_KEY")) {
    return url.replace(/(%5B|\[)?WebAPI_KEY(%5D|\])?/gi, apiKey);
  }

  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch {
    return url;
  }

  if (urlObj.searchParams.has("key")) {
    urlObj.searchParams.set("key", apiKey);
    return urlObj.toString();
  }

  const keyPathMatch = url.match(/^(.*\/key\/)([^/?#]+)(.*)?$/);
  if (keyPathMatch) {
    return `${keyPathMatch[1]}${apiKey}${keyPathMatch[3] ?? ""}`;
  }

  urlObj.searchParams.set("key", apiKey);
  return urlObj.toString();
}

export default async function handler(
  req: { method?: string; body: { url?: unknown } },
  res: { status: (c: number) => any; json: (d: unknown) => void },
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawUrl = req.body?.url;
  if (!rawUrl || typeof rawUrl !== "string") {
    return res.status(400).json({ error: "Field 'url' harus berupa string yang valid" });
  }

  try {
    new URL(rawUrl.trim());
  } catch {
    return res.status(400).json({ error: "URL tidak valid" });
  }

  const apiKey = process.env.BPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "BPS_API_KEY tidak dikonfigurasi di server" });
  }

  const targetUrl = injectApiKey(rawUrl, apiKey);

  // Mengembalikan URL yang sudah di-resolve saja.
  // Browser akan fetch langsung ke BPS API untuk menghindari blokir Cloudflare
  // pada IP serverless/datacenter.
  return res.status(200).json({ success: true, resolvedUrl: targetUrl });
}
