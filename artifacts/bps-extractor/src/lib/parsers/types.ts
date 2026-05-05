export type BpsFormat = "dynamic" | "simdasi" | "list" | "unknown";

export interface ParsedTable {
  format: BpsFormat;
  title: string;
  subtitle?: string;
  unit?: string;
  note?: string;
  source?: string;
  yearLabel?: string;
  columns: string[];
  rows: (string | number | null)[][];
}
