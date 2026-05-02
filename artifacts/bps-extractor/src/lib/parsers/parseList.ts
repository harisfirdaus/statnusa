import type { ParsedTable } from "./types";

function guessTitle(items: Record<string, unknown>[]): string {
  // Look for common title-like fields in the first item
  const first = items[0] ?? {};
  const titleKeys = ["judul_tabel", "title", "name", "nama", "domain_name", "turth", "th", "unit"];
  for (const k of titleKeys) {
    if (k in first) return "Daftar Data BPS";
  }
  return "Daftar Data BPS";
}

function friendlyHeader(key: string): string {
  const map: Record<string, string> = {
    domain_id: "ID Domain",
    domain_name: "Nama Domain",
    domain_url: "URL Domain",
    sub_id: "ID Subjek",
    title: "Judul",
    subcat_id: "ID Kategori",
    subcat: "Kategori",
    ntabel: "Jumlah Tabel",
    ntable: "Jumlah Tabel",
    var_id: "ID Variabel",
    sub_name: "Nama Subjek",
    def: "Definisi",
    notes: "Catatan",
    vertical: "Vertikal",
    unit: "Satuan",
    graph_name: "Tipe Grafik",
    turth_id: "ID Sub-Periode",
    turth: "Sub-Periode",
    turvar_id: "ID Turunan Var",
    turvar: "Turunan Variabel",
    vervar_id: "ID Vertikal Var",
    vervar: "Variabel Vertikal",
    th_id: "ID Periode",
    th: "Tahun",
    unit_id: "ID Satuan",
    id: "ID",
    kegiatan: "Kegiatan",
    tahun_kegiatan: "Tahun Kegiatan",
    topik: "Topik",
    nama: "Nama",
    deskripsi: "Deskripsi",
  };
  return map[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseList(data: Record<string, unknown>): ParsedTable {
  const dataArr = data.data as unknown[];
  // data[0] = pagination info, data[1] = array of items
  const items = dataArr[1] as Record<string, unknown>[];

  if (!Array.isArray(items) || items.length === 0) {
    return {
      format: "list",
      title: "Data BPS (daftar kosong)",
      columns: [],
      rows: [],
    };
  }

  // Collect all unique keys from all items (excluding internal/meta keys)
  const skipKeys = new Set(["change_log", "metadata"]);
  const keySet = new Set<string>();
  for (const item of items.slice(0, 20)) {
    for (const k of Object.keys(item)) {
      if (!skipKeys.has(k)) keySet.add(k);
    }
  }

  const keys = [...keySet];
  const columns = keys.map(friendlyHeader);

  const rows = items.map((item) =>
    keys.map((k) => {
      const v = item[k];
      if (v === null || v === undefined) return null;
      if (typeof v === "object") return JSON.stringify(v);
      const num = Number(v);
      if (!isNaN(num) && typeof v !== "boolean" && String(v).trim() !== "") return num;
      return String(v)
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/<[^>]*>/g, "")
        .trim();
    })
  ) as (string | number | null)[][];

  const pagination = dataArr[0] as Record<string, unknown>;
  const total = pagination?.total ?? items.length;

  return {
    format: "list",
    title: guessTitle(items),
    subtitle: `Total: ${total} item`,
    columns,
    rows,
  };
}
