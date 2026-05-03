import { Router } from "express";

const router = Router();

const DW_API = "https://api.datawrapper.de/v3";

// Chart types that need a legend when multi-series
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

// For vertical column charts, Datawrapper needs transpose=true so that:
//   CSV columns (e.g. "Perkotaan S1", "Perdesaan S1") → X-axis groups
//   CSV rows (e.g. provinces)                          → colored series
// This matches what Datawrapper's own dashboard does when selecting "Grouped Columns".
const TRANSPOSE_TYPES = new Set(["column-chart", "stacked-column-chart"]);

/** Parse column names from the first CSV line, handling quoted values. */
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

/** Extract the label (first cell) from each data row. */
function parseCsvRowLabels(csv: string): string[] {
  const lines = csv.split(/\r?\n/).slice(1); // skip header
  const labels: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('"')) {
      const end = trimmed.indexOf('"', 1);
      labels.push(end >= 0 ? trimmed.slice(1, end) : trimmed.slice(1));
    } else {
      const comma = trimmed.indexOf(",");
      labels.push(comma >= 0 ? trimmed.slice(0, comma) : trimmed);
    }
  }
  return labels;
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
  const resolvedDesc  = typeof description === "string" ? description : "";
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

  const useTranspose = TRANSPOSE_TYPES.has(resolvedChartType);

  // For transposed charts (column-chart, stacked-column-chart):
  //   series = rows (province labels) → use row labels for color keys
  // For non-transposed charts (bars, lines, etc.):
  //   series = columns → use column headers for color keys
  const csvHeaders   = parseCsvHeaders(csvData);
  const dataColumns  = csvHeaders.slice(1);          // excludes label column
  const rowLabels    = parseCsvRowLabels(csvData);   // province/category names

  const seriesNames = useTranspose ? rowLabels : dataColumns;

  let customColors: Record<string, string> | null = null;
  if (resolvedPalette && resolvedPalette.length > 0 && seriesNames.length > 0) {
    customColors = {};
    seriesNames.forEach((name, i) => {
      customColors![name] = resolvedPalette[i % resolvedPalette.length];
    });
  }

  const needsLegend = MULTI_SERIES_TYPES.has(resolvedChartType) && seriesNames.length > 1;

  const initialMetadata = {
    describe: {
      intro: resolvedDesc,
      "source-name": "Badan Pusat Statistik (BPS)",
      "source-url": "https://www.bps.go.id",
    },
    annotate: { notes: resolvedNotes },
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
      id: string; publicUrl?: string; [k: string]: unknown;
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

    // ── Step 3: PATCH metadata – transpose, colors, legend ───────────────────
    // Must run AFTER data upload so Datawrapper recognises series names.
    if (customColors || needsLegend || useTranspose) {
      const visualize: Record<string, unknown> = {};
      if (customColors) visualize["custom-colors"] = customColors;
      if (needsLegend)  visualize["legend"] = true;

      const patchMeta: Record<string, unknown> = { visualize };
      if (useTranspose) patchMeta["data"] = { transpose: true };

      await fetch(`${DW_API}/charts/${chartId}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ metadata: patchMeta }),
        signal: AbortSignal.timeout(10_000),
      }).catch(() => { /* non-fatal */ });
    }

    // ── Step 4: Publish ───────────────────────────────────────────────────────
    const publishRes = await fetch(`${DW_API}/charts/${chartId}/publish`, {
      method: "POST",
      headers: jsonHeaders,
      signal: AbortSignal.timeout(15_000),
    });

    const publishData = publishRes.ok ? await publishRes.json().catch(() => ({})) : {};
    const editUrl  = `https://app.datawrapper.de/chart/${chartId}/edit`;
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
