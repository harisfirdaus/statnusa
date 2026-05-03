import { Router } from "express";

const router = Router();

const DW_API = "https://api.datawrapper.de/v3";

// Chart types where a legend should be explicitly enabled
const MULTI_SERIES_TYPES = new Set([
  "d3-bars-grouped",
  "d3-bars-stacked",
  "d3-bars-split",
  "column-chart",
  "stacked-column-chart",
  "d3-lines",
  "area-chart",
  "d3-pies",
]);

/**
 * Parse column names from the first CSV line, handling quoted values.
 */
function parseCsvHeaders(csv: string): string[] {
  const firstLine = csv.split(/\r?\n/)[0] ?? "";
  const cols: string[] = [];
  let inQuote = false;
  let cur = "";
  for (const ch of firstLine) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      cols.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

router.post("/datawrapper/create", async (req, res) => {
  const { title, chartType, csvData, description, notes, palette } = req.body ?? {};

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Field 'title' harus diisi" });
  }
  if (!csvData || typeof csvData !== "string") {
    return res.status(400).json({ error: "Field 'csvData' harus diisi" });
  }

  const resolvedChartType = typeof chartType === "string" ? chartType : "d3-bars";
  const resolvedDesc = typeof description === "string" ? description : "";
  const resolvedNotes = typeof notes === "string" ? notes : "";
  const resolvedPalette: string[] | null =
    Array.isArray(palette) && palette.every((c) => typeof c === "string")
      ? (palette as string[])
      : null;

  const apiKey = process.env.DATAWRAPPER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "DATAWRAPPER_API_KEY tidak dikonfigurasi di server" });
  }

  const jsonHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Parse CSV headers to map palette colors → column names
  const csvHeaders = parseCsvHeaders(csvData);
  const dataColumns = csvHeaders.slice(1); // first column is the label/x-axis

  // Build custom-colors: { "ColName": "#hexcolor" }
  let customColors: Record<string, string> | null = null;
  if (resolvedPalette && resolvedPalette.length > 0 && dataColumns.length > 0) {
    customColors = {};
    dataColumns.forEach((col, i) => {
      customColors![col] = resolvedPalette[i % resolvedPalette.length];
    });
  }

  const needsLegend =
    MULTI_SERIES_TYPES.has(resolvedChartType) && dataColumns.length > 1;

  // Initial metadata (no colors yet — set via PATCH after data upload)
  const initialMetadata = {
    describe: {
      intro: resolvedDesc,
      "source-name": "Badan Pusat Statistik (BPS)",
      "source-url": "https://www.bps.go.id",
    },
    annotate: {
      notes: resolvedNotes,
    },
  };

  try {
    // ── Step 1: Create chart ──────────────────────────────────────────────────
    const createRes = await fetch(`${DW_API}/charts`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ title, type: resolvedChartType, metadata: initialMetadata }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      return res.status(createRes.status).json({
        error: `Datawrapper: gagal membuat chart (${createRes.status})`,
        details: errBody.slice(0, 300),
      });
    }

    const chart = (await createRes.json()) as {
      id: string;
      publicUrl?: string;
      [k: string]: unknown;
    };
    const chartId = chart.id;

    // ── Step 2: Upload CSV data ───────────────────────────────────────────────
    const dataRes = await fetch(`${DW_API}/charts/${chartId}/data`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "text/csv" },
      body: csvData,
      signal: AbortSignal.timeout(15_000),
    });

    if (!dataRes.ok) {
      const errBody = await dataRes.text();
      return res.status(dataRes.status).json({
        error: `Datawrapper: gagal upload data (${dataRes.status})`,
        details: errBody.slice(0, 300),
      });
    }

    // ── Step 3: PATCH metadata – colors & legend ──────────────────────────────
    // Must happen AFTER data upload so Datawrapper recognises column names.
    if (customColors || needsLegend) {
      const visualize: Record<string, unknown> = {};
      if (customColors) visualize["custom-colors"] = customColors;
      if (needsLegend)  visualize["legend"] = true;

      await fetch(`${DW_API}/charts/${chartId}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ metadata: { visualize } }),
        signal: AbortSignal.timeout(10_000),
      }).catch(() => { /* non-fatal – chart still publishable */ });
    }

    // ── Step 4: Publish ───────────────────────────────────────────────────────
    const publishRes = await fetch(`${DW_API}/charts/${chartId}/publish`, {
      method: "POST",
      headers: jsonHeaders,
      signal: AbortSignal.timeout(15_000),
    });

    const publishData = publishRes.ok ? await publishRes.json().catch(() => ({})) : {};
    const editUrl = `https://app.datawrapper.de/chart/${chartId}/edit`;
    const publicUrl =
      (publishData as any)?.data?.publicUrl ??
      chart.publicUrl ??
      `https://datawrapper.de/render/${chartId}/`;

    return res.json({ success: true, chartId, editUrl, publicUrl, published: publishRes.ok });
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      return res.status(504).json({ error: "Timeout saat menghubungi Datawrapper API" });
    }
    req.log.error({ err }, "Datawrapper error");
    return res.status(500).json({
      error: "Gagal membuat chart di Datawrapper",
      details: err.message,
    });
  }
});

export default router;
