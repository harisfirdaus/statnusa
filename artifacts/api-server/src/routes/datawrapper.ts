import { Router } from "express";

const router = Router();

const DW_API = "https://api.datawrapper.de/v3";

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

const BAR_SORT_TYPES = new Set([
  "d3-bars",
  "d3-bars-grouped",
  "d3-bars-stacked",
  "d3-bars-split",
]);

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

router.post("/datawrapper/create", async (req, res) => {
  const { title, chartType, csvData, description, notes, palette, sortBars } = req.body ?? {};

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
  const resolvedSortBars = sortBars === true;

  const apiKey = process.env.DATAWRAPPER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "DATAWRAPPER_API_KEY tidak dikonfigurasi di server" });
  }

  const jsonHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Compute series names from CSV column headers (excludes first label column)
  const csvHeaders  = parseCsvHeaders(csvData);
  const seriesNames = csvHeaders.slice(1);

  const needsLegend = MULTI_SERIES_TYPES.has(resolvedChartType) && seriesNames.length > 1;

  let customColors: Record<string, string> | null = null;
  if (resolvedPalette && resolvedPalette.length > 0 && seriesNames.length > 0) {
    customColors = {};
    seriesNames.forEach((name, i) => {
      customColors![name] = resolvedPalette[i % resolvedPalette.length];
    });
  }

  // Build complete visualize metadata upfront so it is included at chart
  // creation time — avoids any timing gap between a PATCH and publish.
  const visualize: Record<string, unknown> = {};
  if (needsLegend) {
    // Set all known Datawrapper legend keys to be safe across chart types
    visualize["legend"]      = true;
    visualize["show-legend"] = true;
  }
  if (customColors) {
    visualize["custom-colors"] = customColors;
  }
  if (resolvedSortBars && BAR_SORT_TYPES.has(resolvedChartType)) {
    visualize["sort-by"] = "values";
  }

  const initialMetadata: Record<string, unknown> = {
    describe: {
      intro: resolvedDesc,
      "source-name": "Badan Pusat Statistik (BPS)",
      "source-url": "https://www.bps.go.id",
    },
    annotate: { notes: resolvedNotes },
  };
  if (Object.keys(visualize).length > 0) {
    initialMetadata["visualize"] = visualize;
  }

  try {
    // ── Step 1: Create chart with complete metadata ───────────────────────────
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

    // ── Step 3: Publish ───────────────────────────────────────────────────────
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
