import { useState, useMemo } from "react";
import { ExternalLink, BarChart2, Loader2, CheckCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { createDatawrapperChart } from "@/lib/api";
import { tableToCSV } from "@/lib/csv";
import type { ParsedTable } from "@/lib/parsers";

const MONO   = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const PANEL  = "#0d130d";
const INPUT  = "#060c06";
const GREEN  = "#22c55e";
const BRIGHT = "#4ade80";
const LIGHT  = "#86efac";
const DIM    = "#166534";
const BORDER = "#14532d";

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
    return <span className="text-xs italic" style={{ color: DIM }}>default Datawrapper</span>;
  return (
    <span className="flex gap-1">
      {colors.map((c) => (
        <span key={c} className="w-4 h-4 inline-block flex-shrink-0"
          style={{ background: c, border: `1px solid ${BORDER}` }} />
      ))}
    </span>
  );
}

interface SectionProps {
  label: string; badge?: string;
  open: boolean; onToggle: () => void;
  children: React.ReactNode;
}

function Section({ label, badge, open, onToggle, children }: SectionProps) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors"
        style={{ background: PANEL, color: GREEN }}
      >
        <span>
          {open ? "[-]" : "[+]"}{" "}{label}
          {badge && <span className="ml-1.5" style={{ color: DIM }}>{badge}</span>}
        </span>
        {open ? <ChevronUp className="w-3 h-3" style={{ color: DIM }} /> : <ChevronDown className="w-3 h-3" style={{ color: DIM }} />}
      </button>
      {open && (
        <div className="p-3" style={{ borderTop: `1px solid ${BORDER}`, background: "#0b100b" }}>
          {children}
        </div>
      )}
    </div>
  );
}

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

  const [showCols, setShowCols]     = useState(false);
  const [showRows, setShowRows]     = useState(false);
  const [showColor, setShowColor]   = useState(false);

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
    const colIdxs    = Array.from(validCols).sort((a, b) => a - b);
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

  const inputStyle = {
    background: INPUT, border: `1px solid ${BORDER}`,
    color: LIGHT, fontFamily: MONO, fontSize: "12px",
  };
  const inputClass = "w-full px-3 py-2 text-xs focus:outline-none";

  return (
    <div className="space-y-3" style={{ fontFamily: MONO }}>
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center gap-2 text-xs"
        style={{ background: PANEL, border: `1px solid ${BORDER}`, color: BRIGHT }}>
        <BarChart2 className="w-3 h-3" />
        DATAWRAPPER EXPORT
      </div>

      {result ? (
        <div className="p-4 space-y-3 text-xs" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2" style={{ color: "#4ade80" }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>[OK] Chart berhasil dibuat dan dipublikasikan!</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a href={result.editUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold"
              style={{ background: DIM, color: "#dcfce7" }}>
              <ExternalLink className="w-3 h-3" /> [EDIT_DATAWRAPPER]
            </a>
            <a href={result.publicUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs"
              style={{ border: `1px solid ${BORDER}`, color: GREEN }}>
              <ExternalLink className="w-3 h-3" /> [PUBLIC_URL]
            </a>
          </div>
          <p style={{ color: DIM }}>chart_id={result.chartId}</p>
          <button onClick={() => setResult(null)} className="text-xs underline" style={{ color: DIM }}>
            [RESET] buat chart baru dengan data yang sama
          </button>
        </div>
      ) : (
        <div className="space-y-3" style={{ border: `1px solid ${BORDER}`, padding: "1rem", background: PANEL }}>
          {/* Title */}
          <div className="text-xs space-y-1">
            <div style={{ color: DIM }}>
              title=
              <input type="text" value={chartTitle} onChange={(e) => setChartTitle(e.target.value)}
                maxLength={120} placeholder="Judul chart Datawrapper"
                className="focus:outline-none px-2 py-1 ml-1 w-72"
                style={inputStyle} />
            </div>
          </div>

          {/* Description */}
          <div className="text-xs">
            <div style={{ color: DIM }} className="mb-1">desc= <span style={{ color: DIM, opacity: 0.6 }}>(opsional)</span></div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} maxLength={500} placeholder="Teks pendek di bawah judul chart"
              className={`${inputClass} resize-none`} style={inputStyle} />
          </div>

          {/* Notes */}
          <div className="text-xs">
            <div style={{ color: DIM }} className="mb-1">notes= <span style={{ color: DIM, opacity: 0.6 }}>(opsional)</span></div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} maxLength={500} placeholder="Catatan/footnote di bawah chart"
              className={`${inputClass} resize-none`} style={inputStyle} />
          </div>

          {/* Chart type */}
          <div className="text-xs">
            <div className="flex items-center gap-2" style={{ color: DIM }}>
              type=
              <select value={chartType} onChange={(e) => setChartType(e.target.value)}
                className="px-2 py-1 focus:outline-none"
                style={{ ...inputStyle, width: "auto" }}>
                {CHART_TYPES.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.items.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {(chartType === "column-chart" || chartType === "grouped-column-chart" || chartType === "stacked-column-chart") && (
              <p className="mt-1.5 text-xs px-2 py-1.5"
                style={{ background: "#1a1200", border: "1px solid #713f12", color: "#fcd34d" }}>
                [TIP] Column Chart: pilih 5–10 baris agar tidak terlalu padat.
                Untuk semua provinsi, gunakan Grouped/Stacked Bars (horizontal).
              </p>
            )}
            {["d3-bars","d3-bars-grouped","d3-bars-stacked","d3-bars-split"].includes(chartType) && (
              <label className="mt-2 flex items-center gap-2 cursor-pointer select-none text-xs" style={{ color: GREEN }}>
                <input type="checkbox" checked={sortBars} onChange={(e) => setSortBars(e.target.checked)}
                  className="w-3.5 h-3.5" style={{ accentColor: BRIGHT }} />
                sort_desc=true
              </label>
            )}
          </div>

          {/* Accordion sections */}
          <Section label="palette" badge={`— ${PALETTES[paletteIdx].name}`}
            open={showColor} onToggle={() => setShowColor((s) => !s)}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PALETTES.map((p, i) => (
                <button key={i} onClick={() => setPaletteIdx(i)}
                  className="flex flex-col gap-1.5 p-2 text-left transition-all text-xs"
                  style={{
                    border: `1px solid ${paletteIdx === i ? BRIGHT : BORDER}`,
                    background: paletteIdx === i ? "#0d1f0d" : "transparent",
                    color: paletteIdx === i ? BRIGHT : DIM,
                  }}>
                  <span className="truncate">{p.name}</span>
                  <PaletteDots colors={p.colors} />
                </button>
              ))}
            </div>
          </Section>

          <Section label="cols"
            badge={`(${dataColsSelected}/${columns.length - 1} dipilih)`}
            open={showCols} onToggle={() => setShowCols((s) => !s)}>
            <div className="flex gap-3 text-xs mb-2">
              <button onClick={() => setSelectedCols(new Set(columns.map((_, i) => i)))}
                className="underline" style={{ color: GREEN }}>all</button>
              <button onClick={() => setSelectedCols(new Set([0]))}
                className="underline" style={{ color: DIM }}>none</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 max-h-48 overflow-y-auto">
              {columns.map((col, i) => (
                <label key={i} className={`flex items-center gap-2 px-2 py-1 text-xs cursor-pointer ${i === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ color: validCols.has(i) ? LIGHT : DIM }}>
                  <input type="checkbox" checked={validCols.has(i)} onChange={() => toggleCol(i)}
                    disabled={i === 0} style={{ accentColor: BRIGHT }} />
                  <span className="truncate">
                    {i === 0 ? <>{col} <span style={{ color: DIM }}>(label)</span></> : col}
                  </span>
                </label>
              ))}
            </div>
          </Section>

          <Section label="rows"
            badge={`(${rowsSelected}/${table.rows.length} dipilih)`}
            open={showRows} onToggle={() => setShowRows((s) => !s)}>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: DIM }} />
                  <input type="search" placeholder="search rows..." value={rowSearch}
                    onChange={(e) => setRowSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs focus:outline-none"
                    style={inputStyle} />
                </div>
                <div className="flex gap-2 text-xs flex-shrink-0">
                  <button onClick={selectAllRows} className="underline" style={{ color: GREEN }}>all</button>
                  <button onClick={selectNoRows} className="underline" style={{ color: DIM }}>none</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 max-h-56 overflow-y-auto">
                {filteredRowIndices.map(({ i, label }) => (
                  <label key={i} className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer"
                    style={{ color: selectedRows.has(i) ? LIGHT : DIM }}>
                    <input type="checkbox" checked={selectedRows.has(i)} onChange={() => toggleRow(i)}
                      style={{ accentColor: BRIGHT }} />
                    <span className="truncate">{label || `row_${i + 1}`}</span>
                  </label>
                ))}
                {filteredRowIndices.length === 0 && (
                  <p className="col-span-2 text-xs py-2 text-center" style={{ color: DIM }}>
                    [EMPTY] tidak ada baris yang cocok
                  </p>
                )}
              </div>
            </div>
          </Section>

          <p className="text-xs" style={{ color: DIM }}>
            payload: {rowsSelected}_rows × {dataColsSelected + 1}_cols → Datawrapper
          </p>

          {error && (
            <div className="text-xs px-3 py-2"
              style={{ background: "#1a0000", border: "1px solid #7f1d1d", color: "#fca5a5" }}>
              [ERROR] {error}
            </div>
          )}

          <button onClick={handleCreate}
            disabled={loading || rowsSelected === 0 || dataColsSelected === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            style={{ background: DIM, color: "#dcfce7", border: "none", cursor: loading || rowsSelected === 0 || dataColsSelected === 0 ? "not-allowed" : "pointer" }}>
            {loading
              ? <><Loader2 className="w-3 h-3 animate-spin" />[PUSHING_TO_DATAWRAPPER]</>
              : <><BarChart2 className="w-3 h-3" />[PUSH_TO_DATAWRAPPER]</>}
          </button>
        </div>
      )}
    </div>
  );
}
