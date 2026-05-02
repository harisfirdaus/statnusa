export type { BpsFormat, ParsedTable } from "./types";
export { detectFormat } from "./detectFormat";
export { parseDynamic } from "./parseDynamic";
export { parseSimdasi } from "./parseSimdasi";
export { parseList } from "./parseList";

import { detectFormat } from "./detectFormat";
import { parseDynamic } from "./parseDynamic";
import { parseSimdasi } from "./parseSimdasi";
import { parseList } from "./parseList";
import type { ParsedTable } from "./types";

export function parseData(data: unknown): ParsedTable {
  const format = detectFormat(data);
  const d = data as Record<string, unknown>;

  switch (format) {
    case "dynamic":
      return parseDynamic(d);
    case "simdasi":
      return parseSimdasi(d);
    case "list":
      return parseList(d);
    default:
      return {
        format: "unknown",
        title: "Format Tidak Dikenal",
        subtitle: "Tidak dapat mendeteksi format data BPS ini secara otomatis.",
        columns: [],
        rows: [],
      };
  }
}
