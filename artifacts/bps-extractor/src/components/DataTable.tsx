import { useState, useMemo, useRef, useEffect } from "react";
import { Download, Search, Pencil } from "lucide-react";
import { tableToCSV, downloadCSV } from "@/lib/csv";
import type { ParsedTable } from "@/lib/parsers";

function formatNumber(v: number): string {
  return v.toLocaleString("id-ID");
}

interface DataTableProps {
  table: ParsedTable;
  columns: string[];
  onColumnRename: (idx: number, name: string) => void;
}

function EditableHeader({
  name,
  idx,
  onRename,
  onSort,
  sortActive,
  sortAsc,
}: {
  name: string;
  idx: number;
  onRename: (idx: number, name: string) => void;
  onSort: (idx: number) => void;
  sortActive: boolean;
  sortAsc: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(idx, trimmed);
    else setDraft(name);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(name); setEditing(false); }
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full min-w-[80px] px-1 py-0.5 text-sm border border-neutral-800 rounded focus:outline-none focus:ring-2 focus:ring-neutral-900 font-semibold"
      />
    );
  }

  return (
    <span className="flex items-center gap-1 group/header">
      <span
        className="cursor-pointer select-none"
        onClick={() => onSort(idx)}
      >
        {name}
        {sortActive ? (
          <span className="ml-1 text-neutral-800">{sortAsc ? "↑" : "↓"}</span>
        ) : (
          <span className="ml-1 text-gray-300">↕</span>
        )}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Ganti nama kolom"
        className="opacity-0 group-hover/header:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-200"
      >
        <Pencil className="w-3 h-3 text-gray-400" />
      </button>
    </span>
  );
}

export function DataTable({ table, columns, onColumnRename }: DataTableProps) {
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
    if (sortCol === idx) setSortAsc((a) => !a);
    else { setSortCol(idx); setSortAsc(true); }
  }

  function handleDownload() {
    const csv = tableToCSV(columns, table.rows);
    const filename = `${table.title.slice(0, 50).replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_")}.csv`;
    downloadCSV(filename, csv);
  }

  if (columns.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
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
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{filtered.length} baris</span>
          <span>·</span>
          <span>{columns.length} kolom</span>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors ml-auto sm:ml-0"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <Pencil className="w-3 h-3" />
        Arahkan kursor ke nama kolom lalu klik ikon pensil untuk mengubah nama kolom.
      </p>

      <div className="overflow-auto rounded-xl border border-gray-200 shadow-sm max-h-[500px]">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                >
                  <EditableHeader
                    name={col}
                    idx={i}
                    onRename={onColumnRename}
                    onSort={handleSort}
                    sortActive={sortCol === i}
                    sortAsc={sortAsc}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data yang cocok
                </td>
              </tr>
            ) : (
              filtered.map((row, ri) => (
                <tr
                  key={ri}
                  className={`border-b border-gray-100 hover:bg-neutral-50 transition-colors ${
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
