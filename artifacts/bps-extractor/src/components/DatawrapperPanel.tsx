import { useState, useMemo } from "react";
import { ExternalLink, BarChart2, Loader2, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { createDatawrapperChart } from "@/lib/api";
import { tableToCSV } from "@/lib/csv";
import type { ParsedTable } from "@/lib/parsers";

const CHART_TYPES = [
  { group: "Bar (Horizontal)", items: [
    { value: "d3-bars",         label: "Bar Chart" },
    { value: "d3-bars-stacked", label: "Stacked Bars" },
    { value: "d3-bars-grouped", label: "Grouped Bars" },
    { value: "d3-bars-split",   label: "Split Bars" },
  ]},
  { group: "Column (Vertikal)", items: [
    { value: "column-chart",         label: "Grouped Columns" },
    { value: "stacked-column-chart", label: "Stacked Columns" },
    { value: "grouped-column-chart", label: "Multiple Columns" },
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

interface DatawrapperPanelProps {
  table: ParsedTable;
  columns: string[];
}

export function DatawrapperPanel({ table, columns }: DatawrapperPanelProps) {
  const [chartType, setChartType] = useState("d3-bars");
  const [chartTitle, setChartTitle] = useState(table.title.slice(0, 120));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColPicker, setShowColPicker] = useState(false);
  const [result, setResult] = useState<{
    chartId: string;
    editUrl: string;
    publicUrl: string;
    published: boolean;
  } | null>(null);

  // selectedCols: indices of columns to include (column 0 = label, always included)
  const [selectedCols, setSelectedCols] = useState<Set<number>>(
    () => new Set(columns.map((_, i) => i))
  );

  // When columns change externally, keep valid indices
  const validSelected = useMemo(() => {
    const valid = new Set<number>();
    selectedCols.forEach((i) => { if (i < columns.length) valid.add(i); });
    return valid;
  }, [selectedCols, columns.length]);

  function toggleCol(idx: number) {
    if (idx === 0) return; // label column always included
    setSelectedCols((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function selectAll() {
    setSelectedCols(new Set(columns.map((_, i) => i)));
  }

  function selectNone() {
    setSelectedCols(new Set([0])); // always keep label
  }

  const selectedCount = validSelected.size;
  const dataColsSelected = selectedCount - 1; // minus label col

  const filteredCSV = useMemo(() => {
    const sortedIndices = Array.from(validSelected).sort((a, b) => a - b);
    const filteredCols = sortedIndices.map((i) => columns[i]);
    const filteredRows = table.rows.map((row) => sortedIndices.map((i) => row[i]));
    return tableToCSV(filteredCols, filteredRows);
  }, [validSelected, columns, table.rows]);

  async function handleCreate() {
    if (dataColsSelected === 0) {
      setError("Pilih minimal satu kolom data untuk divisualisasi.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await createDatawrapperChart({
        title: chartTitle || table.title,
        chartType,
        csvData: filteredCSV,
        description: table.subtitle ?? table.unit ?? "",
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
            <a
              href={result.editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Edit di Datawrapper
            </a>
            <a
              href={result.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Lihat Chart Publik
            </a>
          </div>
          <p className="text-xs text-gray-400">Chart ID: {result.chartId}</p>
          <button
            onClick={() => setResult(null)}
            className="text-xs text-blue-600 hover:underline"
          >
            Buat chart baru dengan data yang sama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul Chart
            </label>
            <input
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              maxLength={120}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Judul chart Datawrapper"
            />
          </div>

          {/* Chart type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Chart
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CHART_TYPES.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.items.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Column picker */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowColPicker((s) => !s)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>
                Kolom yang divisualisasikan{" "}
                <span className="text-gray-400 font-normal">
                  ({dataColsSelected} dari {columns.length - 1} kolom data dipilih)
                </span>
              </span>
              {showColPicker
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {showColPicker && (
              <div className="border-t border-gray-200 p-3 space-y-2 bg-gray-50">
                <div className="flex gap-3 text-xs mb-2">
                  <button onClick={selectAll} className="text-blue-600 hover:underline">Pilih semua</button>
                  <button onClick={selectNone} className="text-gray-500 hover:underline">Hapus semua</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                  {columns.map((col, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-white transition-colors ${
                        i === 0 ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={validSelected.has(i)}
                        onChange={() => toggleCol(i)}
                        disabled={i === 0}
                        className="rounded accent-blue-600"
                      />
                      <span className="truncate" title={col}>
                        {i === 0 ? (
                          <span>
                            {col}{" "}
                            <span className="text-xs text-gray-400">(label)</span>
                          </span>
                        ) : col}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            {table.rows.length} baris akan dikirim ke Datawrapper menggunakan API key yang dikonfigurasi di server.
          </p>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading || table.rows.length === 0 || dataColsSelected === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Membuat chart…
              </>
            ) : (
              <>
                <BarChart2 className="w-4 h-4" />
                Buat Visualisasi
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
