import type { ParsedTable } from "@/lib/parsers";

export function buildTableContext(table: ParsedTable, columns: string[]): string {
  const lines: string[] = [];
  lines.push(`Judul: ${table.title}`);
  if (table.source) lines.push(`Sumber: ${table.source}`);
  if (table.unit) lines.push(`Satuan: ${table.unit}`);
  if (table.subtitle) lines.push(`Info: ${table.subtitle}`);
  lines.push("");
  lines.push(columns.join(" | "));
  lines.push(columns.map(() => "---").join(" | "));
  const MAX_ROWS = 150;
  const rows = table.rows.slice(0, MAX_ROWS);
  for (const row of rows) {
    lines.push(row.map((c) => (c === null ? "-" : String(c))).join(" | "));
  }
  if (table.rows.length > MAX_ROWS) {
    lines.push(`... (${table.rows.length - MAX_ROWS} baris lainnya tidak ditampilkan)`);
  }
  return lines.join("\n");
}

export const DW_DESCRIPTION_PROMPT =
  "Tulis deskripsi singkat untuk grafik Datawrapper berdasarkan data ini. " +
  "Maksimal 2 kalimat: kalimat pertama menjelaskan apa yang ditampilkan, " +
  "kalimat kedua menyebutkan temuan/insight paling menonjol dari data. " +
  "Gunakan bahasa Indonesia yang ringkas dan lugas, tanpa bullet point atau markdown.";

export function parseAiError(raw: string): string {
  if (raw.includes("DEGRADED") || raw.includes("sedang tidak tersedia"))
    return "Semua model AI sedang tidak tersedia di server NVIDIA. Coba lagi dalam beberapa menit.";
  if (raw.includes("504") || raw.includes("timeout") || raw.toLowerCase().includes("timeout"))
    return "Permintaan timeout — model membutuhkan terlalu banyak waktu. Coba pertanyaan yang lebih singkat.";
  if (raw.includes("429"))
    return "Terlalu banyak permintaan ke NVIDIA API. Tunggu sebentar lalu coba lagi.";
  if (raw.includes("401") || raw.includes("403"))
    return "NVIDIA API key tidak valid atau tidak memiliki akses. Hubungi administrator.";
  if (raw.includes("500"))
    return "Terjadi kesalahan internal di server NVIDIA. Coba lagi.";
  return raw;
}
