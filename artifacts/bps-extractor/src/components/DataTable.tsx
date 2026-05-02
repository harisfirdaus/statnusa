import { useState, useMemo } from "react";
import { Download, Search } from "lucide-react";
import { tableToCSV, downloadCSV } from "@/lib/csv";
import type { ParsedTable } from "@/lib/parsers";

function formatNumber(v: number, decimals = 0): string {
  return v.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface DataTableProps {
  table: ParsedTable;
}

export function DataTable({ table }: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let rows = table.rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        row.some((cell) => cell !== null && String(cell).toLowerCase().includes(q))
      );
    }
    if (sortCol !== null) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        if (typeof av === "number" && typeof bv === "number") {
          return sortAsc ? av - bv : bv - av;
        }
        return sortAsc
          ? String(av).localeCompare(String(bv), "id")
          : String(bv).localeCompare(String(av), "id");
      });
    }
    return rows;
  }, [table.rows, search, sortCol, sortAsc]);

  function handleSort(idx: number) {
    if (sortCol === idx) {
      setSortAsc((a) => !a);
    } else {
      setSortCol(idx);
      setSortAsc(true);
    }
  }

  function handleDownload() {
    const csv = tableToCSV(table.columns, table.rows);
    const filename = `${table.title.slice(0, 50).replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_")}.csv`;
    downloadCSV(filename, csv);
  }

  if (table.columns.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Tidak ada kolom yang dapat ditampilkan.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Cari data…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{filtered.length} baris</span>
          <span>·</span>
          <span>{table.columns.length} kolom</span>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-auto sm:ml-0"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200 shadow-sm max-h-[500px]">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              {table.columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors select-none"
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {sortCol === i ? (
                      <span className="text-blue-600">{sortAsc ? "↑" : "↓"}</span>
                    ) : (
                      <span className="text-gray-300">↕</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={table.columns.length} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data yang cocok
                </td>
              </tr>
            ) : (
              filtered.map((row, ri) => (
                <tr
                  key={ri}
                  className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${
                    ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-2.5 ${
                        ci === 0
                          ? "font-medium text-gray-800 whitespace-nowrap"
                          : "text-right tabular-nums text-gray-700"
                      }`}
                    >
                      {cell === null ? (
                        <span className="text-gray-300">—</span>
                      ) : typeof cell === "number" ? (
                        formatNumber(cell)
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
