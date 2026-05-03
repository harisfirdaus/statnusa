import type { ParsedTable } from "./types";

function stripHtml(html: string): string {
  // Decode entities FIRST, then strip resulting tags
  return String(html ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#60;/g, "<")
    .replace(/&#62;/g, ">")
    .replace(/&#8804;/g, "≤")
    .replace(/&nbsp;/g, " ")
    .replace(/&sup(\d+);/g, (_, n) => String.fromCharCode(0x2070 + (n === "1" ? 1 : n === "2" ? 2 : n === "3" ? 3 : 0)))
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Parse an Indonesian-formatted number string.
 * BPS uses dots as thousand separators and commas as decimal separators.
 * e.g. "5.487" → 5487, "1.234,56" → 1234.56
 */
function parseIdNumber(raw: string): number | string {
  const s = String(raw).trim();
  // If contains comma, treat as decimal separator
  if (s.includes(",")) {
    const n = Number(s.replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? s : n;
  }
  // Dots only — treat as thousand separators (remove them)
  const n = Number(s.replace(/\./g, ""));
  return isNaN(n) ? s : n;
}

function extractValue(raw: unknown): string | number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s === "" || s === "..." || s === "–" || s === "-" || s === "NA") return null;
  return parseIdNumber(s);
}

export function parseSimdasi(data: Record<string, unknown>): ParsedTable {
  const dataArr = data.data as unknown[];
  const tableData = dataArr[1] as Record<string, unknown>;

  const title = stripHtml(
    String(tableData.judul_tabel ?? tableData.judul_tabel_en ?? "Data SIMDASI BPS")
  );

  // Parse column definitions — kolom is keyed by variable ID
  const kolom = (tableData.kolom ?? {}) as Record<string, Record<string, unknown>>;
  const kolKeys = Object.keys(kolom);
  const kolHeaders = kolKeys.map((k) => stripHtml(String(kolom[k].nama_variabel ?? k)));

  // The rows are in tableData.data — each item has { label, variables: { [colId]: { value, ... } } }
  const rawRows = tableData.data as unknown[];
  const rows: (string | number | null)[][] = [];

  if (Array.isArray(rawRows)) {
    for (const item of rawRows) {
      if (typeof item !== "object" || item === null) continue;
      const r = item as Record<string, unknown>;

      // Row label
      const label = String(r.label ?? r.label_raw ?? r.nama ?? "");

      // Values from variables map (new SIMDASI structure)
      const varsMap = r.variables as Record<string, Record<string, unknown>> | undefined;

      let values: (string | number | null)[];
      if (varsMap && typeof varsMap === "object") {
        values = kolKeys.map((k) => {
          const entry = varsMap[k];
          if (!entry) return null;
          return extractValue(entry.value ?? entry.value_raw);
        });
      } else {
        // Fallback: values stored directly on the row object
        values = kolKeys.map((k) => extractValue(r[k]));
      }

      rows.push([label, ...values]);
    }
  }

  const rowLabelHeader = stripHtml(String(tableData.lingkup_id ?? tableData.lingkup ?? "Wilayah"));
  const columns = [rowLabelHeader || "Wilayah", ...kolHeaders];

  // Build legend note
  const keterangan = tableData.keterangan_data;
  let note: string | undefined;
  if (keterangan && typeof keterangan === "object") {
    const entries = Object.entries(keterangan as Record<string, string>)
      .map(([k, v]) => `${k} = ${stripHtml(v)}`)
      .join("; ");
    note = entries || undefined;
  }

  return {
    format: "simdasi",
    title,
    source: String(tableData.penanggung_jawab ?? "BPS"),
    note,
    columns,
    rows,
  };
}
