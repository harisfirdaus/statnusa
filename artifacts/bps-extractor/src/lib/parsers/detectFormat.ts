import type { BpsFormat } from "./types";

export function detectFormat(data: unknown): BpsFormat {
  if (!data || typeof data !== "object") return "unknown";
  const d = data as Record<string, unknown>;

  if (d.status !== "OK") return "unknown";

  // Format A: Dynamic data — has var[], turvar[], vervar[], tahun[], turtahun[], datacontent (plain object)
  if (
    Array.isArray(d.var) &&
    d.var.length > 0 &&
    d.datacontent &&
    typeof d.datacontent === "object" &&
    !Array.isArray(d.datacontent)
  ) {
    return "dynamic";
  }

  // Format B: SIMDASI / static table — data[1] is an object with kolom or judul_tabel
  if (Array.isArray(d.data)) {
    const dataArr = d.data as unknown[];
    const second = dataArr[1];
    if (
      second &&
      typeof second === "object" &&
      !Array.isArray(second) &&
      ("kolom" in (second as object) || "judul_tabel" in (second as object))
    ) {
      return "simdasi";
    }

    // Format C: Standard list — data[0] has page, data[1] is array of objects
    const first = dataArr[0];
    if (
      first &&
      typeof first === "object" &&
      "page" in (first as object) &&
      Array.isArray(dataArr[1]) &&
      dataArr[1].length > 0
    ) {
      return "list";
    }
  }

  return "unknown";
}
