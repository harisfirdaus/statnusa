import { useState, useEffect } from "react";
import { Search, Loader2, AlertCircle, Database, ChevronDown, ChevronUp } from "lucide-react";
import { fetchBpsData } from "@/lib/api";
import { parseData } from "@/lib/parsers";
import { MetaInfo } from "@/components/MetaInfo";
import { DataTable } from "@/components/DataTable";
import { DatawrapperPanel } from "@/components/DatawrapperPanel";
import type { ParsedTable } from "@/lib/parsers";

const EXAMPLE_URLS = [
  {
    label: "Perceraian Menurut Faktor (SIMDASI)",
    url: "https://webapi.bps.go.id/v1/api/interoperabilitas/datasource/simdasi/id/25/tahun/2025/id_tabel/aWhSR0ViS3hxc1hWZlZEbExjNVpDUT09/wilayah/0000000/key/WebAPI_KEY",
  },
  {
    label: "Daftar Domain BPS",
    url: "https://webapi.bps.go.id/v1/api/domain/type/all/key/WebAPI_KEY",
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<unknown>(null);
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [editedColumns, setEditedColumns] = useState<string[]>([]);
  const [showRaw, setShowRaw] = useState(false);

  // Sync editedColumns whenever a new table is loaded
  useEffect(() => {
    if (table) setEditedColumns([...table.columns]);
  }, [table]);

  function handleColumnRename(idx: number, name: string) {
    setEditedColumns((prev) => {
      const next = [...prev];
      next[idx] = name;
      return next;
    });
  }

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setTable(null);
    setRawData(null);
    setShowRaw(false);

    try {
      const result = await fetchBpsData(trimmed);
      setRawData(result.data);
      const parsed = parseData(result.data);
      setTable(parsed);
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white flex-shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">BPS Data Extractor</h1>
            <p className="text-xs text-gray-500">Ekstrak &amp; Visualisasi Data Badan Pusat Statistik</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* URL Input */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 mb-1">Masukkan URL API BPS</h2>
            <p className="text-sm text-gray-500">
              Tempel URL dari{" "}
              <a
                href="https://webapi.bps.go.id/documentation/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                dokumentasi BPS API
              </a>
              . Ganti <code className="bg-gray-100 px-1 rounded text-xs">WebAPI_KEY</code> dengan
              teks tersebut — API key akan diisi otomatis oleh server.
            </p>
          </div>

          <form onSubmit={handleFetch} className="space-y-3">
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://webapi.bps.go.id/v1/api/interoperabilitas/datasource/simdasi/id/25/tahun/2025/id_tabel/.../wilayah/0000000/key/WebAPI_KEY"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
              disabled={loading}
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengambil data…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Ambil Data
                  </>
                )}
              </button>
              {loading && <span className="text-sm text-gray-500">Mengambil dari BPS API…</span>}
            </div>
          </form>

          {/* Example URLs */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Contoh URL:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_URLS.map((ex) => (
                <button
                  key={ex.url}
                  onClick={() => setUrl(ex.url)}
                  className="text-xs px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Gagal mengambil data</p>
              <p className="mt-0.5 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {table && editedColumns.length > 0 && (
          <div className="space-y-5">
            {/* Title + Meta */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">{table.title}</h2>
              <MetaInfo table={table} />
            </div>

            {/* Data Table */}
            {table.columns.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <DataTable
                  table={table}
                  columns={editedColumns}
                  onColumnRename={handleColumnRename}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                Format data ini terdeteksi sebagai <strong>{table.format}</strong>, namun parser
                belum dapat mengekstrak tabel. Lihat data mentah di bawah untuk memeriksa
                strukturnya.
              </div>
            )}

            {/* Datawrapper */}
            {table.columns.length > 0 && table.rows.length > 0 && (
              <DatawrapperPanel table={table} columns={editedColumns} />
            )}

            {/* Raw JSON toggle */}
            {rawData && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowRaw((s) => !s)}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>Lihat Data Mentah (JSON)</span>
                  {showRaw ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showRaw && (
                  <pre className="bg-gray-900 text-green-400 text-xs p-4 overflow-auto max-h-80 font-mono">
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-xs text-gray-400 text-center">
        Data bersumber dari{" "}
        <a
          href="https://webapi.bps.go.id"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          BPS Web API
        </a>
        . Visualisasi via{" "}
        <a
          href="https://www.datawrapper.de"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Datawrapper
        </a>
        .
      </footer>
    </div>
  );
}
