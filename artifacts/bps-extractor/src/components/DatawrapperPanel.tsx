import { useState } from "react";
import { ExternalLink, BarChart2, Loader2, CheckCircle } from "lucide-react";
import { createDatawrapperChart } from "@/lib/api";
import { tableToCSV } from "@/lib/csv";
import type { ParsedTable } from "@/lib/parsers";

const CHART_TYPES = [
  { value: "d3-bars", label: "Bar Chart (Horizontal)" },
  { value: "column-chart", label: "Column Chart (Vertikal)" },
  { value: "d3-lines", label: "Line Chart" },
  { value: "d3-pies", label: "Pie Chart" },
  { value: "tables", label: "Tabel Interaktif" },
];

interface DatawrapperPanelProps {
  table: ParsedTable;
}

export function DatawrapperPanel({ table }: DatawrapperPanelProps) {
  const [chartType, setChartType] = useState("d3-bars");
  const [chartTitle, setChartTitle] = useState(table.title.slice(0, 120));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    chartId: string;
    editUrl: string;
    publicUrl: string;
    published: boolean;
  } | null>(null);

  async function handleCreate() {
    if (table.columns.length === 0 || table.rows.length === 0) {
      setError("Tidak ada data untuk divisualisasi.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const csvData = tableToCSV(table.columns, table.rows);
      const res = await createDatawrapperChart({
        title: chartTitle || table.title,
        chartType,
        csvData,
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
        <div className="space-y-3">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Chart
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CHART_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500">
            Data ({table.rows.length} baris, {table.columns.length} kolom) akan dikirim ke Datawrapper menggunakan API key yang dikonfigurasi di server.
          </p>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading || table.rows.length === 0}
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
