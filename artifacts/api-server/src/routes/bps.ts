import { Router } from "express";

const router = Router();

function injectApiKey(rawUrl: string, apiKey: string): string {
  const url = rawUrl.trim();

  if (url.includes("WebAPI_KEY")) {
    return url.replace(/WebAPI_KEY/g, apiKey);
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

router.post("/bps/fetch", async (req, res) => {
  const rawUrl: unknown = req.body?.url;
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

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "BPS-Extractor/1.0",
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `BPS API mengembalikan status ${response.status}`,
        statusText: response.statusText,
      });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return res.status(502).json({ error: "Respons bukan JSON", preview: text.slice(0, 300) });
    }

    const data = await response.json();

    if (data["data-availability"] === "not-available") {
      return res.status(404).json({ error: "Data tidak tersedia untuk URL yang diberikan" });
    }

    return res.json({ success: true, data, resolvedUrl: targetUrl });
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      return res.status(504).json({ error: "Permintaan ke BPS API timeout (>30 detik)" });
    }
    req.log.error({ err }, "BPS fetch error");
    return res.status(500).json({ error: "Gagal mengambil data dari BPS API", details: err.message });
  }
});

export default router;
