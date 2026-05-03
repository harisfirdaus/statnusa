import { useState, useMemo } from "react";
import {
  ExternalLink, BarChart2, Loader2, CheckCircle,
  ChevronDown, ChevronUp, Search,
} from "lucide-react";
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
    { value: "column-chart",         label: "Grouped Columns (multi-seri)" },
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

interface Palette {
  name: string;
  colors: string[];
}

const PALETTES: Palette[] = [
  { name: "Default", colors: [] },
  { name: "Biru BPS",       colors: ["#1a4f8a","#2e6eb5","#4a8ecf","#6fb0e8","#9acef5","#c6e4fa"] },
  { name: "Merah–Oranye",   colors: ["#9b2226","#c0392b","#e74c3c","#e67e22","#f39c12","#f5cba7"] },
  { name: "Hijau Alam",     colors: ["#145a32","#1e8449","#27ae60","#52be80","#a9dfbf","#d5f5e3"] },
  { name: "Ungu Elegan",    colors: ["#4a235a","#6c3483","#9b59b6","#bb8fce","#d7bde2","#f5eef8"] },
  { name: "Biru–Merah",     colors: ["#1a5276","#2471a3","#3498db","#c0392b","#e74c3c","#f1948a"] },
  { name: "Monokrom",       colors: ["#1a1a1a","#404040","#666666","#999999","#cccccc","#eeeeee"] },
  { name: "Hangat",         colors: ["#922b21","#d35400","#e67e22","#f1c40f","#f9e79f","#fdfefe"] },
];

function PaletteDots({ colors }: { colors: string[] }) {
  if (colors.length === 0)
    return <span className="text-xs text-gray-400 italic">Warna default Datawrapper</span>;
  return (
    <span className="flex gap-1">
      {colors.map((c) => (
        <span key={c} className="w-4 h-4 rounded-sm border border-gray-200 inline-block" style={{ background: c }} />
      ))}
    </span>
  );
}

interface SectionProps {
  label: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ label, badge, open, onToggle, children }: SectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>
          {label}
          {badge && <span className="ml-1.5 text-gray-400 font-normal">{badge}</span>}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-200 p-3 bg-gray-50">{children}</div>}
    </div>
  );
}

interface DatawrapperPanelProps {
  table: ParsedTable;
  columns: string[];
}

export function DatawrapperPanel({ table, columns }: DatawrapperPanelProps) {
  const [chartType, setChartType]   = useState("d3-bars");
  const [chartTitle, setChartTitle] = useState(table.title.slice(0, 120));
  const [description, setDescription] = useState("");
  const [notes, setNotes]           = useState(table.note?.slice(0, 300) ?? "");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [sortBars, setSortBars]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<{
    chartId: string; editUrl: string; publicUrl: string; published: boolean;
  } | null>(null);

  // Section toggles
  const [showCols, setShowCols]   = useState(false);
  const [showRows, setShowRows]   = useState(false);
  const [showColor, setShowColor] = useState(false);

  // Column selection (index 0 = label, always included)
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

  // Row selection
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

  // Build CSV from selections
  const filteredCSV = useMemo(() => {
    const colIdxs = Array.from(validCols).sort((a, b) => a - b);
    const filteredCols = colIdxs.map((i) => columns[i]);
    const filteredRows = table.rows
      .filter((_, i) => selectedRows.has(i))
      .map((row) => colIdxs.map((i) => row[i]));
    return tableToCSV(filteredCols, filteredRows);
  }, [validCols, columns, table.rows, selectedRows]);

  const dataColsSelected = validCols.size - 1;
  const rowsSelected = selectedRows.size;

  async function handleCreate() {
    if (dataColsSelected === 0) { setError("Pilih minimal satu kolom data."); return; }
    if (rowsSelected === 0)     { setError("Pilih minimal satu baris data."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const palette = PALETTES[paletteIdx].colors;
      const res = await createDatawrapperChart({
        title: chartTitle || table.title,
        chartType,
        csvData: filteredCSV,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        palette: palette.length > 0 ? palette : undefined,
        sortBars: sortBars || undefined,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message ?? "Gagal membuat chart di Datawrapper.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Buat Visualisasi di Datawrapper</h3>
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Chart berhasil dibuat dan dipublikasikan!</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a href={result.editUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ExternalLink className="w-4 h-4" /> Edit di Datawrapper
            </a>
            <a href={result.publicUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <ExternalLink className="w-4 h-4" /> Lihat Chart Publik
            </a>
          </div>
          <p className="text-xs text-gray-400">Chart ID: {result.chartId}</p>
          <button onClick={() => setResult(null)} className="text-xs text-blue-600 hover:underline">
            Buat chart baru dengan data yang sama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* ── Basic info ── */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Chart</label>
              <input type="text" value={chartTitle} onChange={(e) => setChartTitle(e.target.value)}
                maxLength={120} placeholder="Judul chart Datawrapper"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={2} maxLength={500} placeholder="Teks pendek di bawah judul chart"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan / Footnote <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={2} maxLength={500} placeholder="Catatan yang muncul di bawah chart, misalnya keterangan simbol"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
            </div>
          </div>

          {/* ── Chart type ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Chart</label>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {CHART_TYPES.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.items.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {(chartType === "column-chart" || chartType === "stacked-column-chart") && (
              <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Untuk Column Chart, pilih <strong>5–10 baris</strong> saja di pemilih baris agar chart tidak terlalu padat.
                Untuk semua provinsi, gunakan <strong>Grouped/Stacked Bars</strong> (horizontal).
              </p>
            )}
            {["d3-bars","d3-bars-grouped","d3-bars-stacked","d3-bars-split"].includes(chartType) && (
              <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sortBars}
                  onChange={(e) => setSortBars(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Urutkan dari nilai terbesar ke terkecil</span>
              </label>
            )}
          </div>

          {/* ── Color palette ── */}
          <Section
            label="Warna Chart"
            badge={`— ${PALETTES[paletteIdx].name}`}
            open={showColor}
            onToggle={() => setShowColor((s) => !s)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PALETTES.map((p, i) => (
                <button key={i} onClick={() => setPaletteIdx(i)}
                  className={`flex flex-col gap-1.5 p-2 rounded-lg border text-left transition-all ${
                    paletteIdx === i
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}>
                  <span className="text-xs font-medium text-gray-700 truncate">{p.name}</span>
                  <PaletteDots colors={p.colors} />
                </button>
              ))}
            </div>
          </Section>

          {/* ── Column picker ── */}
          <Section
            label="Kolom yang divisualisasikan"
            badge={`(${dataColsSelected} dari ${columns.length - 1} dipilih)`}
            open={showCols}
            onToggle={() => setShowCols((s) => !s)}
          >
            <div className="flex gap-3 text-xs mb-2">
              <button onClick={() => setSelectedCols(new Set(columns.map((_, i) => i)))} className="text-blue-600 hover:underline">Pilih semua</button>
              <button onClick={() => setSelectedCols(new Set([0]))} className="text-gray-500 hover:underline">Hapus semua</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {columns.map((col, i) => (
                <label key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-white transition-colors ${i === 0 ? "opacity-60 cursor-not-allowed" : ""}`}>
                  <input type="checkbox" checked={validCols.has(i)} onChange={() => toggleCol(i)} disabled={i === 0} className="rounded accent-blue-600" />
                  <span className="truncate" title={col}>
                    {i === 0 ? <>{col} <span className="text-xs text-gray-400">(label)</span></> : col}
                  </span>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Row picker ── */}
          <Section
            label="Baris yang divisualisasikan"
            badge={`(${rowsSelected} dari ${table.rows.length} dipilih)`}
            open={showRows}
            onToggle={() => setShowRows((s) => !s)}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input type="search" placeholder="Cari baris…" value={rowSearch}
                    onChange={(e) => setRowSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2 text-xs flex-shrink-0">
                  <button onClick={selectAllRows} className="text-blue-600 hover:underline">Semua</button>
                  <button onClick={selectNoRows} className="text-gray-500 hover:underline">Hapus</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-56 overflow-y-auto">
                {filteredRowIndices.map(({ i, label }) => (
                  <label key={i} className="flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-white transition-colors">
                    <input type="checkbox" checked={selectedRows.has(i)} onChange={() => toggleRow(i)} className="rounded accent-blue-600" />
                    <span className="truncate" title={label}>{label || `Baris ${i + 1}`}</span>
                  </label>
                ))}
                {filteredRowIndices.length === 0 && (
                  <p className="col-span-2 text-xs text-gray-400 py-2 text-center">Tidak ada baris yang cocok</p>
                )}
              </div>
            </div>
          </Section>

          <p className="text-xs text-gray-500">
            {rowsSelected} baris × {dataColsSelected + 1} kolom akan dikirim ke Datawrapper.
          </p>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <button onClick={handleCreate}
            disabled={loading || rowsSelected === 0 || dataColsSelected === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Membuat chart…</>
            ) : (
              <><BarChart2 className="w-4 h-4" />Buat Visualisasi</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
