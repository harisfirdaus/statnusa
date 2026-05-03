import { useState, useMemo } from "react";
import { ExternalLink, BarChart2, Loader2, CheckCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { createDatawrapperChart } from "@/lib/api";
import { tableToCSV } from "@/lib/csv";
import type { ParsedTable } from "@/lib/parsers";

const CHART_TYPES = [
  { group: "Bar (Horizontal)", items: [
    { value: "d3-bars",         label: "Bar Chart (1 seri)" },
    { value: "d3-bars-grouped", label: "Grouped Bars (multi-seri)" },
    { value: "d3-bars-stacked", label: "Stacked Bars (multi-seri)" },
    { value: "d3-bars-split",   label: "Split Bars" },
  ]},
  { group: "Column (Vertikal)", items: [
    { value: "column-chart",         label: "Column Chart" },
    { value: "grouped-column-chart", label: "Grouped Columns (multi-seri)" },
    { value: "stacked-column-chart", label: "Stacked Columns (multi-seri)" },
  ]},
  { group: "Garis & Area", items: [
    { value: "d3-lines",   label: "Multiple Lines" },
    { value: "area-chart", label: "Area Chart" },
  ]},
  { group: "Lainnya", items: [
    { value: "d3-pies", label: "Pie Chart" },
    { value: "tables",  label: "Tabel Interaktif" },
  ]},
];

interface Palette { name: string; colors: string[]; }

const PALETTES: Palette[] = [
  { name: "Default",      colors: [] },
  { name: "Biru BPS",     colors: ["#1a4f8a","#2e6eb5","#4a8ecf","#6fb0e8","#9acef5","#c6e4fa"] },
  { name: "Merah-Oranye", colors: ["#9b2226","#c0392b","#e74c3c","#e67e22","#f39c12","#f5cba7"] },
  { name: "Hijau Alam",   colors: ["#145a32","#1e8449","#27ae60","#52be80","#a9dfbf","#d5f5e3"] },
  { name: "Ungu Elegan",  colors: ["#4a235a","#6c3483","#9b59b6","#bb8fce","#d7bde2","#f5eef8"] },
  { name: "Biru-Merah",   colors: ["#1a5276","#2471a3","#3498db","#c0392b","#e74c3c","#f1948a"] },
  { name: "Monokrom",     colors: ["#1a1a1a","#404040","#666666","#999999","#cccccc","#eeeeee"] },
  { name: "Hangat",       colors: ["#922b21","#d35400","#e67e22","#f1c40f","#f9e79f","#fdfefe"] },
];

function PaletteDots({ colors }: { colors: string[] }) {
  if (colors.length === 0)
    return <span className="text-xs italic text-neutral-400 dark:text-neutral-500">default Datawrapper</span>;
  return (
    <span className="flex gap-1">
      {colors.map((c) => (
        <span key={c} className="w-4 h-4 inline-block flex-shrink-0 border border-neutral-200 dark:border-neutral-600"
          style={{ background: c }} />
      ))}
    </span>
  );
}

function Section({ label, badge, open, onToggle, children }: {
  label: string; badge?: string; open: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-700">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <span>
          {label}
          {badge && <span className="ml-2 font-normal normal-case tracking-normal text-neutral-400 dark:text-neutral-500">{badge}</span>}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-800">{children}</div>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors";

interface DatawrapperPanelProps {
  table: ParsedTable;
  columns: string[];
}

export function DatawrapperPanel({ table, columns }: DatawrapperPanelProps) {
  const [chartType, setChartType]     = useState("d3-bars");
  const [chartTitle, setChartTitle]   = useState(table.title.slice(0, 120));
  const [description, setDescription] = useState("");
  const [notes, setNotes]             = useState(table.note?.slice(0, 300) ?? "");
  const [paletteIdx, setPaletteIdx]   = useState(0);
  const [sortBars, setSortBars]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [result, setResult]           = useState<{
    chartId: string; editUrl: string; publicUrl: string; published: boolean;
  } | null>(null);

  const [showCols, setShowCols]   = useState(false);
  const [showRows, setShowRows]   = useState(false);
  const [showColor, setShowColor] = useState(false);

  const [selectedCols, setSelectedCols] = useState<Set<number>>(
    () => new Set(columns.map((_, i) => i))
  );
  const validCols = useMemo(() => {
    const s = new Set<number>();
    selectedCols.forEach((i) => { if (i < columns.length) s.add(i); });
    return s;
  }, [selectedCols, columns.length]);

  function toggleCol(i: number) {
    if (i === 0) return;
    setSelectedCols((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  const [selectedRows, setSelectedRows] = useState<Set<number>>(
    () => new Set(table.rows.map((_, i) => i))
  );
  const [rowSearch, setRowSearch] = useState("");

  function toggleRow(i: number) {
    setSelectedRows((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }
  function selectAllRows() { setSelectedRows(new Set(table.rows.map((_, i) => i))); }
  function selectNoRows()  { setSelectedRows(new Set()); }

  const filteredRowIndices = useMemo(() => {
    const q = rowSearch.toLowerCase();
    return table.rows
      .map((row, i) => ({ i, label: String(row[0] ?? "") }))
      .filter(({ label }) => !q || label.toLowerCase().includes(q));
  }, [table.rows, rowSearch]);

  const filteredCSV = useMemo(() => {
    const colIdxs      = Array.from(validCols).sort((a, b) => a - b);
    const filteredCols = colIdxs.map((i) => columns[i]);
    const filteredRows = table.rows
      .filter((_, i) => selectedRows.has(i))
      .map((row) => colIdxs.map((i) => row[i]));
    return tableToCSV(filteredCols, filteredRows);
  }, [validCols, columns, table.rows, selectedRows]);

  const dataColsSelected = validCols.size - 1;
  const rowsSelected     = selectedRows.size;

  async function handleCreate() {
    if (dataColsSelected === 0) { setError("Pilih minimal satu kolom data."); return; }
    if (rowsSelected === 0)     { setError("Pilih minimal satu baris data."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const palette = PALETTES[paletteIdx].colors;
      const res = await createDatawrapperChart({
        title:       chartTitle || table.title,
        chartType,
        csvData:     filteredCSV,
        description: description.trim() || undefined,
        notes:       notes.trim() || undefined,
        palette:     palette.length > 0 ? palette : undefined,
        sortBars:    sortBars || undefined,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message ?? "Gagal membuat chart di Datawrapper.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Buat Visualisasi di Datawrapper
        </h3>
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs border border-neutral-300 dark:border-neutral-600 px-4 py-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-neutral-700 dark:text-neutral-300" />
            <span className="text-neutral-700 dark:text-neutral-300">Chart berhasil dibuat dan dipublikasikan.</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href={result.editUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-white transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Edit di Datawrapper
            </a>
            <a href={result.publicUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-neutral-300 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Lihat Chart Publik
            </a>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">chart_id: {result.chartId}</p>
          <button onClick={() => setResult(null)}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline underline-offset-2">
            Buat chart baru dengan data yang sama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1.5">Judul Chart</label>
            <input type="text" value={chartTitle} onChange={(e) => setChartTitle(e.target.value)}
              maxLength={120} placeholder="Judul chart Datawrapper" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1.5">
              Deskripsi <span className="font-normal normal-case">(opsional)</span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} maxLength={500} placeholder="Teks pendek di bawah judul chart"
              className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1.5">
              Catatan / Footnote <span className="font-normal normal-case">(opsional)</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} maxLength={500} placeholder="Catatan di bawah chart"
              className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1.5">Tipe Chart</label>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)} className={inputCls}>
              {CHART_TYPES.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.items.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
            {(chartType === "column-chart" || chartType === "grouped-column-chart" || chartType === "stacked-column-chart") && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-2">
                Tip: Column Chart lebih baik untuk 5–10 kategori. Untuk seluruh provinsi (38), gunakan Grouped/Stacked Bars (horizontal).
              </p>
            )}
            {["d3-bars","d3-bars-grouped","d3-bars-stacked","d3-bars-split"].includes(chartType) && (
              <label className="mt-2 flex items-center gap-2 cursor-pointer select-none text-sm text-neutral-700 dark:text-neutral-300">
                <input type="checkbox" checked={sortBars} onChange={(e) => setSortBars(e.target.checked)} className="accent-neutral-900 dark:accent-neutral-100" />
                Urutkan bar dari nilai terbesar
              </label>
            )}
          </div>

          <Section label="Warna Chart" badge={`— ${PALETTES[paletteIdx].name}`} open={showColor} onToggle={() => setShowColor((s) => !s)}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PALETTES.map((p, i) => (
                <button key={i} onClick={() => setPaletteIdx(i)}
                  className={`flex flex-col gap-1.5 p-2 border text-left transition-all ${paletteIdx === i ? "border-neutral-900 dark:border-neutral-300 bg-white dark:bg-neutral-700" : "border-neutral-200 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-400"}`}>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{p.name}</span>
                  <PaletteDots colors={p.colors} />
                </button>
              ))}
            </div>
          </Section>

          <Section label="Kolom" badge={`(${dataColsSelected} dari ${columns.length - 1} dipilih)`} open={showCols} onToggle={() => setShowCols((s) => !s)}>
            <div className="flex gap-3 text-xs mb-2">
              <button onClick={() => setSelectedCols(new Set(columns.map((_, i) => i)))}
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline underline-offset-2">Semua</button>
              <button onClick={() => setSelectedCols(new Set([0]))}
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2">Hapus semua</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 max-h-48 overflow-y-auto">
              {columns.map((col, i) => (
                <label key={i} className={`flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-white dark:hover:bg-neutral-700 transition-colors ${i === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <input type="checkbox" checked={validCols.has(i)} onChange={() => toggleCol(i)} disabled={i === 0} className="accent-neutral-900 dark:accent-neutral-100" />
                  <span className="text-neutral-700 dark:text-neutral-300 truncate">
                    {i === 0 ? <>{col} <span className="text-xs text-neutral-400 dark:text-neutral-500">(label)</span></> : col}
                  </span>
                </label>
              ))}
            </div>
          </Section>

          <Section label="Baris" badge={`(${rowsSelected} dari ${table.rows.length} dipilih)`} open={showRows} onToggle={() => setShowRows((s) => !s)}>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                  <input type="search" placeholder="Cari baris…" value={rowSearch} onChange={(e) => setRowSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300" />
                </div>
                <div className="flex gap-2 text-xs flex-shrink-0">
                  <button onClick={selectAllRows} className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline underline-offset-2">Semua</button>
                  <button onClick={selectNoRows}  className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2">Hapus</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 max-h-56 overflow-y-auto">
                {filteredRowIndices.map(({ i, label }) => (
                  <label key={i} className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-white dark:hover:bg-neutral-700 transition-colors">
                    <input type="checkbox" checked={selectedRows.has(i)} onChange={() => toggleRow(i)} className="accent-neutral-900 dark:accent-neutral-100" />
                    <span className="text-neutral-700 dark:text-neutral-300 truncate">{label || `Baris ${i + 1}`}</span>
                  </label>
                ))}
                {filteredRowIndices.length === 0 && (
                  <p className="col-span-2 text-xs text-neutral-400 dark:text-neutral-500 py-2 text-center">Tidak ada baris yang cocok.</p>
                )}
              </div>
            </div>
          </Section>

          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {rowsSelected} baris × {dataColsSelected + 1} kolom akan dikirim ke Datawrapper.
          </p>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2">{error}</p>
          )}

          <button onClick={handleCreate} disabled={loading || rowsSelected === 0 || dataColsSelected === 0}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-white transition-colors tracking-wide disabled:opacity-50">
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Membuat chart…</>
              : <><BarChart2 className="w-3.5 h-3.5" />BUAT VISUALISASI</>}
          </button>
        </div>
      )}
    </div>
  );
}
