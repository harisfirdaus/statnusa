import type { ParsedTable } from "./types";

/**
 * Merge multiple ParsedTables (same indicator, different years) into a single table.
 * Rows are matched by the first column (label) using case-insensitive comparison.
 * Missing rows are filled with null. Columns from each table are suffixed with the year label.
 */
export function mergeMultiYear(tables: ParsedTable[]): ParsedTable | null {
  if (tables.length === 0) return null;
  if (tables.length === 1) return tables[0];

  // Sort by yearLabel ascending (numeric-aware). Tables without yearLabel go last.
  const sorted = [...tables].sort((a, b) => {
    const ay = a.yearLabel ?? "";
    const by = b.yearLabel ?? "";
    if (ay === "" && by === "") return 0;
    if (ay === "") return 1;
    if (by === "") return -1;
    return ay.localeCompare(by, undefined, { numeric: true });
  });

  const master = sorted[0];
  const labelCol = master.columns[0];

  // Build merged columns: [label, col1_year1, col2_year1, ..., col1_year2, col2_year2, ...]
  const mergedColumns: string[] = [labelCol];
  for (const t of sorted) {
    for (let c = 1; c < t.columns.length; c++) {
      const suffix = t.yearLabel ? ` ${t.yearLabel}` : "";
      mergedColumns.push(`${t.columns[c]}${suffix}`);
    }
  }

  // Build lookup maps: table index -> Map<label_lower, row>
  const tableRowMaps = sorted.map((t) => {
    const map = new Map<string, (string | number | null)[]>();
    for (const row of t.rows) {
      const label = String(row[0] ?? "").trim().toLowerCase();
      map.set(label, row);
    }
    return map;
  });

  // Collect all unique labels, preserving master order first
  const orderedLabels: string[] = [];
  const seen = new Set<string>();
  for (const row of master.rows) {
    const label = String(row[0] ?? "").trim().toLowerCase();
    if (!seen.has(label)) {
      orderedLabels.push(label);
      seen.add(label);
    }
  }
  for (let ti = 1; ti < sorted.length; ti++) {
    for (const row of sorted[ti].rows) {
      const label = String(row[0] ?? "").trim().toLowerCase();
      if (!seen.has(label)) {
        orderedLabels.push(label);
        seen.add(label);
      }
    }
  }

  // Build merged rows
  const mergedRows: (string | number | null)[][] = [];
  for (const label of orderedLabels) {
    const row: (string | number | null)[] = [];

    // Find original label casing from first table that has it
    for (let ti = 0; ti < sorted.length; ti++) {
      const tRow = tableRowMaps[ti].get(label);
      if (tRow && tRow[0] !== null) {
        row.push(tRow[0]);
        break;
      }
    }
    if (row.length === 0) row.push(label);

    // Append data values (or nulls) from each table
    for (let ti = 0; ti < sorted.length; ti++) {
      const t = sorted[ti];
      const tRow = tableRowMaps[ti].get(label);
      if (tRow) {
        for (let c = 1; c < t.columns.length; c++) {
          row.push(tRow[c]);
        }
      } else {
        for (let c = 1; c < t.columns.length; c++) {
          row.push(null);
        }
      }
    }

    mergedRows.push(row);
  }

  const yearLabels = sorted
    .map((t) => t.yearLabel)
    .filter((y): y is string => Boolean(y));

  return {
    format: master.format,
    title: master.title,
    subtitle: yearLabels.length > 0 ? yearLabels.join(", ") : undefined,
    unit: master.unit,
    source: master.source,
    note: master.note,
    columns: mergedColumns,
    rows: mergedRows,
  };
}
