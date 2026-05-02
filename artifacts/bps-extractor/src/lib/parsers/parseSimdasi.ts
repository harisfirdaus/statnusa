import type { ParsedTable } from "./types";

function stripHtml(html: string): string {
  return String(html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&sup1;/g, "¹")
    .replace(/&sup2;/g, "²")
    .replace(/&sup3;/g, "³")
    .trim();
}

export function parseSimdasi(data: Record<string, unknown>): ParsedTable {
  const dataArr = data.data as unknown[];
  const tableData = dataArr[1] as Record<string, unknown>;

  const title = stripHtml(String(tableData.judul_tabel ?? tableData.judul_tabel_en ?? "Data SIMDASI BPS"));
  const lingkup = stripHtml(String(tableData.lingkup_id ?? tableData.lingkup ?? ""));

  // Parse column definitions
  const kolom = (tableData.kolom ?? {}) as Record<string, Record<string, unknown>>;
  const kolKeys = Object.keys(kolom);
  const kolHeaders = kolKeys.map((k) => String(kolom[k].nama_variabel ?? k));

  // Find rows — try common field names
  const barisRaw =
    tableData.baris ??
    tableData.rows ??
    tableData.data ??
    tableData.datacontent;

  let rows: (string | number | null)[][] = [];

  if (Array.isArray(barisRaw)) {
    rows = barisRaw.map((row: unknown) => {
      if (typeof row !== "object" || row === null) return [];
      const r = row as Record<string, unknown>;

      // Find the row label — first non-numeric string field not in kolKeys
      const labelField = Object.keys(r).find(
        (k) => !kolKeys.includes(k) && typeof r[k] === "string" && isNaN(Number(r[k]))
      );
      const label = labelField ? String(r[labelField]) : "";

      const values = kolKeys.map((k) => {
        const v = r[k];
        if (v === null || v === undefined || v === "..." || v === "-") return null;
        const num = Number(String(v).replace(/[,.]/g, (m) => (m === "." ? "." : "")));
        return isNaN(num) ? String(v) : num;
      });

      return [label, ...values] as (string | number | null)[];
    });
  } else if (barisRaw && typeof barisRaw === "object" && !Array.isArray(barisRaw)) {
    // Sometimes datacontent is an object: { "rowId": { colId: value, ... }, ... }
    rows = Object.entries(barisRaw as Record<string, unknown>).map(([rowLabel, rowValues]) => {
      if (typeof rowValues !== "object" || rowValues === null) return [rowLabel];
      const rv = rowValues as Record<string, unknown>;
      return [
        rowLabel,
        ...kolKeys.map((k) => {
          const v = rv[k];
          if (v === null || v === undefined) return null;
          const num = Number(v);
          return isNaN(num) ? String(v) : num;
        }),
      ] as (string | number | null)[];
    });
  }

  const rowLabelHeader = stripHtml(String(tableData.lingkup_id ?? "Wilayah")) || lingkup || "Wilayah";

  const columns = [rowLabelHeader, ...kolHeaders];

  const keterangan = tableData.keterangan_data;
  let note: string | undefined;
  if (keterangan && typeof keterangan === "object") {
    const entries = Object.entries(keterangan as Record<string, string>)
      .map(([k, v]) => `${k} = ${v}`)
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
