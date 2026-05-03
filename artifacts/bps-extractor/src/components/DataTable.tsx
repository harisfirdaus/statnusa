import { useState, useMemo, useRef, useEffect } from "react";
import { Download, Search, Pencil } from "lucide-react";
import { tableToCSV, downloadCSV } from "@/lib/csv";
import type { ParsedTable } from "@/lib/parsers";

const MONO   = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const BG     = "#0a0f0a";
const PANEL  = "#0d130d";
const INPUT  = "#060c06";
const GREEN  = "#22c55e";
const BRIGHT = "#4ade80";
const LIGHT  = "#86efac";
const DIM    = "#166534";
const BORDER = "#14532d";

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
        className="w-full min-w-[80px] px-1 py-0.5 text-xs focus:outline-none"
        style={{ background: INPUT, border: `1px solid ${GREEN}`, color: BRIGHT, fontFamily: MONO }}
      />
    );
  }

  return (
    <span className="flex items-center gap-1 group/header">
      <span className="cursor-pointer select-none" onClick={() => onSort(idx)}>
        {name}
        {sortActive
          ? <span className="ml-1" style={{ color: BRIGHT }}>{sortAsc ? "↑" : "↓"}</span>
          : <span className="ml-1" style={{ color: DIM }}>↕</span>}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Ganti nama kolom"
        className="opacity-0 group-hover/header:opacity-100 transition-opacity p-0.5"
      >
        <Pencil className="w-3 h-3" style={{ color: DIM }} />
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
      <div className="p-8 text-center text-xs" style={{ color: DIM, fontFamily: MONO }}>
        [WARN] Tidak ada kolom yang dapat ditampilkan.
      </div>
    );
  }

  return (
    <div className="space-y-0" style={{ fontFamily: MONO }}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3"
        style={{ borderBottom: `1px solid ${BORDER}`, background: PANEL }}>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: DIM }} />
          <input
            type="search"
            placeholder="search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs focus:outline-none"
            style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: DIM }}>
          <span>rows={filtered.length}</span>
          <span>·</span>
          <span>cols={columns.length}</span>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ml-auto sm:ml-0 transition-colors"
          style={{ background: DIM, color: "#dcfce7", border: "none" }}
        >
          <Download className="w-3 h-3" />
          [CSV]
        </button>
      </div>

      <p className="px-4 py-2 text-xs flex items-center gap-1.5" style={{ color: DIM, background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <Pencil className="w-3 h-3" />
        hover nama kolom → klik ikon pensil untuk rename
      </p>

      {/* Table */}
      <div className="overflow-auto max-h-[500px]">
        <table className="w-full text-xs border-collapse min-w-max">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
              <th className="px-4 py-2.5 text-left font-bold w-10" style={{ color: DIM }}>#</th>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-2.5 text-left font-bold whitespace-nowrap" style={{ color: BRIGHT }}>
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
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center" style={{ color: DIM }}>
                  [EMPTY] tidak ada data yang cocok
                </td>
              </tr>
            ) : (
              filtered.map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    background: ri % 2 === 0 ? BG : "#0b100b",
                  }}
                >
                  <td className="px-4 py-2 tabular-nums" style={{ color: DIM }}>
                    {String(ri).padStart(3, "0")}
                  </td>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-2 ${ci !== 0 ? "text-right tabular-nums" : "whitespace-nowrap"}`}
                      style={{ color: ci === 0 ? "#6ee7b7" : BRIGHT }}
                    >
                      {cell === null ? (
                        <span style={{ color: DIM }}>—</span>
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
