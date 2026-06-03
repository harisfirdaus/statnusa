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
  name, idx, onRename, onSort, sortActive, sortAsc,
}: {
  name: string; idx: number;
  onRename: (idx: number, name: string) => void;
  onSort: (idx: number) => void;
  sortActive: boolean; sortAsc: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(name);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(name); }, [name]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

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
        className="w-full min-w-[80px] px-1.5 py-0.5 text-xs border border-neutral-900 dark:border-neutral-300 focus:outline-none bg-card dark:bg-card font-mono text-neutral-900 dark:text-neutral-100"
      />
    );
  }

  return (
    <span className="flex items-center gap-1 group/header">
      <span
        className="cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        onClick={() => onSort(idx)}
      >
        {name}
        {sortActive
          ? <span className="ml-1 text-neutral-700 dark:text-neutral-300">{sortAsc ? "↑" : "↓"}</span>
          : <span className="ml-1 text-neutral-300 dark:text-neutral-600">↕</span>}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Ganti nama kolom"
        className="opacity-0 group-hover/header:opacity-100 transition-opacity p-0.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </span>
  );
}

export function DataTable({ table, columns, onColumnRename }: DataTableProps) {
  const [search, setSearch]   = useState("");
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
        const av = a[sortCol], bv = b[sortCol];
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        if (typeof av === "number" && typeof bv === "number")
          return sortAsc ? av - bv : bv - av;
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
    const csv      = tableToCSV(columns, table.rows);
    const filename = `${table.title.slice(0, 50).replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_")}.csv`;
    downloadCSV(filename, csv);
  }

  if (columns.length === 0) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-700 px-6 py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
        Tidak ada kolom yang dapat ditampilkan.
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-card dark:bg-card">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-5 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-card dark:bg-card">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
          <input
            type="search"
            placeholder="Cari…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300 bg-card dark:bg-card text-neutral-700 dark:text-neutral-300 transition-colors"
          />
        </div>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
          <Pencil className="w-3 h-3" />
          Hover header untuk rename
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">
          {filtered.length} dari {table.rows.length} baris
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-900 dark:hover:border-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors ml-auto sm:ml-0"
        >
          <Download className="w-3.5 h-3.5" />
          Unduh CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[520px]">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead className="sticky top-0 z-10 bg-card dark:bg-card">
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`text-left text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-5 py-2.5 pr-8 last:pr-5 bg-card dark:bg-card ${
                    i === 0 ? "sticky left-0 z-20 min-w-44 border-r border-neutral-100 dark:border-neutral-800" : ""
                  }`}
                >
                  <EditableHeader
                    name={col} idx={i}
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
                <td colSpan={columns.length} className="px-5 py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                  Tidak ada data yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              filtered.map((row, ri) => (
                <tr key={ri} className="group border-b border-neutral-100 dark:border-neutral-800 hover:bg-muted dark:hover:bg-muted transition-colors">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-5 py-2.5 pr-8 last:pr-5 text-sm border-b border-neutral-100 dark:border-neutral-800 ${
                        ci !== 0 ? "text-right font-mono tabular-nums" : "sticky left-0 bg-card dark:bg-card group-hover:bg-muted dark:group-hover:bg-muted min-w-44 border-r border-neutral-100 dark:border-neutral-800"
                      } text-neutral-700 dark:text-neutral-300`}
                    >
                      {cell === null ? (
                        <span className="text-neutral-300 dark:text-neutral-600">—</span>
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
