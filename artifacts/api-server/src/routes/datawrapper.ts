import { Router } from "express";

const router = Router();

const DW_API = "https://api.datawrapper.de/v3";

router.post("/datawrapper/create", async (req, res) => {
  const { title, chartType, csvData, description } = req.body ?? {};

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Field 'title' harus diisi" });
  }
  if (!csvData || typeof csvData !== "string") {
    return res.status(400).json({ error: "Field 'csvData' harus diisi" });
  }

  const resolvedChartType = typeof chartType === "string" ? chartType : "d3-bars";
  const resolvedDesc = typeof description === "string" ? description : "";

  const apiKey = process.env.DATAWRAPPER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "DATAWRAPPER_API_KEY tidak dikonfigurasi di server" });
  }

  const jsonHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    // Step 1: Create chart
    const createRes = await fetch(`${DW_API}/charts`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        title,
        type: resolvedChartType,
        metadata: {
          describe: {
            intro: resolvedDesc,
            "source-name": "Badan Pusat Statistik (BPS)",
            "source-url": "https://www.bps.go.id",
          },
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      return res.status(createRes.status).json({
        error: `Datawrapper: gagal membuat chart (${createRes.status})`,
        details: errBody.slice(0, 300),
      });
    }

    const chart = (await createRes.json()) as { id: string; publicUrl?: string; [k: string]: unknown };
    const chartId = chart.id;

    // Step 2: Upload CSV data
    const dataRes = await fetch(`${DW_API}/charts/${chartId}/data`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "text/csv",
      },
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

    // Step 3: Publish the chart
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

    return res.json({
      success: true,
      chartId,
      editUrl,
      publicUrl,
      published: publishRes.ok,
    });
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      return res.status(504).json({ error: "Timeout saat menghubungi Datawrapper API" });
    }
    req.log.error({ err }, "Datawrapper error");
    return res.status(500).json({ error: "Gagal membuat chart di Datawrapper", details: err.message });
  }
});

export default router;
