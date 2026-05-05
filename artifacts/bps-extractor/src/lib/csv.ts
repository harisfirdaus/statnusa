function escapeCell(v: string | number | null): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function tableToCSV(columns: string[], rows: (string | number | null)[][]): string {
  const header = columns.map(escapeCell).join(",");
  const dataRows = rows.map((row) => row.map(escapeCell).join(","));
  return [header, ...dataRows].join("\n");
}

/**
 * Transpose a table so that rows become columns and columns become rows.
 * Useful when Datawrapper auto-detects the wrong orientation (e.g. years
 * detected as series instead of X-axis categories).
 */
export function transposeTable(
  columns: string[],
  rows: (string | number | null)[][],
): { columns: string[]; rows: (string | number | null)[][] } {
  if (rows.length === 0 || columns.length <= 1) {
    return { columns, rows };
  }

  const labelHeader = columns[0];
  const rowLabels = rows.map((r) => String(r[0] ?? ""));

  // New columns: original label header + each original row label
  const newColumns: string[] = [labelHeader, ...rowLabels];

  // New rows: for each original data column, build [colName, val_row1, val_row2, ...]
  const newRows: (string | number | null)[][] = [];
  for (let c = 1; c < columns.length; c++) {
    const newRow: (string | number | null)[] = [columns[c]];
    for (let r = 0; r < rows.length; r++) {
      newRow.push(rows[r][c]);
    }
    newRows.push(newRow);
  }

  return { columns: newColumns, rows: newRows };
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
