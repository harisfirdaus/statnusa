import { useState, useEffect } from "react";
import { Search, Loader2, AlertCircle, ChevronDown, ChevronUp, Database } from "lucide-react";
import { fetchBpsData } from "@/lib/api";
import { parseData } from "@/lib/parsers";
import { MetaInfo } from "@/components/MetaInfo";
import { DataTable } from "@/components/DataTable";
import { DatawrapperPanel } from "@/components/DatawrapperPanel";
import type { ParsedTable } from "@/lib/parsers";

const PREVIEW_BARS = [
  { label: "Papua",             value: 7.08 },
  { label: "Jawa Barat",        value: 6.66 },
  { label: "Banten",            value: 6.63 },
  { label: "Papua Barat Daya",  value: 6.56 },
  { label: "Kep. Riau",         value: 6.35 },
  { label: "DKI Jakarta",       value: 6.31 },
  { label: "Maluku",            value: 6.11 },
  { label: "Sulawesi Utara",    value: 5.78 },
];
const NATIONAL_RATE = 4.74;
const MAX_BAR = 8;

const EXAMPLE_URLS = [
  {
    label: "Pengangguran",
    url: "https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/2401/th/125/key/%5BWebAPI_KEY%5D",
  },
  {
    label: "Umur Harapan Hidup",
    url: "https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/2273/th/125/key/WebAPI_KEY",
  },
  {
    label: "Persentase Penduduk Miskin",
    url: "https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/192/th/125/key/WebAPI_KEY",
  },
];

function PreviewChart() {
  const nationalPct = (NATIONAL_RATE / MAX_BAR) * 100;
  return (
    <div className="space-y-2">
      {PREVIEW_BARS.map(({ label, value }) => {
        const pct = (value / MAX_BAR) * 100;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 w-36 text-right flex-shrink-0 truncate">{label}</span>
            <div className="flex-1 h-5 bg-neutral-100 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-neutral-800" style={{ width: `${pct}%` }} />
              <div className="absolute inset-y-0 w-px bg-neutral-400 opacity-60" style={{ left: `${nationalPct}%` }} />
            </div>
            <span className="text-xs font-mono text-neutral-500 w-8 flex-shrink-0">{value}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-1">
        <span className="w-36 flex-shrink-0" />
        <div className="flex-1 flex justify-between">
          {[0, 2, 4, 6, 8].map((n) => (
            <span key={n} className="text-[10px] text-neutral-300 tabular-nums">{n}%</span>
          ))}
        </div>
        <span className="w-8 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-3 pt-0.5">
        <span className="w-36 flex-shrink-0" />
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
            <span className="w-3 h-3 bg-neutral-800 inline-block flex-shrink-0" />
            8 provinsi tertinggi
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
            <span className="w-px h-3 bg-neutral-400 inline-block flex-shrink-0" />
            Rata-rata nasional ({NATIONAL_RATE}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl]                     = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [rawData, setRawData]             = useState<unknown>(null);
  const [table, setTable]                 = useState<ParsedTable | null>(null);
  const [editedColumns, setEditedColumns] = useState<string[]>([]);
  const [showRaw, setShowRaw]             = useState(false);

  useEffect(() => {
    if (table) setEditedColumns([...table.columns]);
  }, [table]);

  function handleColumnRename(idx: number, name: string) {
    setEditedColumns((prev) => { const next = [...prev]; next[idx] = name; return next; });
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
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-neutral-900 text-white flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 leading-tight tracking-tight">StatNusa</h1>
            <p className="text-xs text-neutral-400">Ekstrak &amp; Visualisasi Data Badan Pusat Statistik</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Hero preview */}
        {!table && !loading && !error && (
          <div className="border border-neutral-200 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-neutral-100 flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-sm">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-300">Contoh Output</p>
                <h2 className="text-base font-bold text-neutral-900 leading-snug">
                  Tingkat Pengangguran Terbuka<br />Menurut Provinsi
                </h2>
                <p className="text-xs text-neutral-400">
                  Tempelkan URL data BPS di bawah untuk menghasilkan tabel &amp; visualisasi serupa dalam hitungan detik.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {[
                  { label: "Periode",  value: "November 2025" },
                  { label: "Cakupan",  value: "38 Provinsi" },
                  { label: "Nasional", value: `${NATIONAL_RATE}%` },
                  { label: "Sumber",   value: "Sakernas, BPS" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-300 font-semibold">{label}</span>
                    <span className="text-xs font-mono text-neutral-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-5">
              <PreviewChart />
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="border border-neutral-200 p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Masukkan URL Data JSON BPS
          </h2>
          <form onSubmit={handleFetch} className="space-y-3">
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://webapi.bps.go.id/v1/api/list/model/data/..."
              rows={2}
              className="w-full px-3 py-2.5 text-xs border border-neutral-300 focus:outline-none focus:border-neutral-900 resize-none font-mono text-neutral-700 bg-white transition-colors"
              disabled={loading}
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-700 transition-colors tracking-wide disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Mengambil data…</>
                  : <><Search className="w-3.5 h-3.5" />AMBIL DATA</>}
              </button>
              {table && (
                <button
                  type="button"
                  onClick={() => { setTable(null); setRawData(null); setUrl(""); setError(null); }}
                  className="text-xs text-neutral-400 hover:text-neutral-700 underline underline-offset-2"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-400 mr-1">Contoh:</span>
            {EXAMPLE_URLS.map((ex) => (
              <button
                key={ex.url}
                onClick={() => setUrl(ex.url)}
                className="text-xs px-3 py-1 border border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 border border-red-200 bg-red-50 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-semibold text-xs text-red-700">Gagal mengambil data</p>
              <p className="mt-0.5 text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {table && editedColumns.length > 0 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-neutral-900 leading-tight">{table.title}</h2>
              {(table.source || table.unit) && (
                <p className="text-xs text-neutral-400">
                  {[table.source, table.unit && `Satuan: ${table.unit}`].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[
                { l: "FORMAT", v: table.format },
                { l: "KOLOM",  v: String(table.columns.length) },
                { l: "BARIS",  v: String(table.rows.length) },
              ].map(({ l, v }) => (
                <span key={l} className="flex items-center gap-1.5 text-xs border border-neutral-200 px-3 py-1">
                  <span className="text-neutral-400 uppercase tracking-widest font-semibold">{l}</span>
                  <span className="text-neutral-700 font-mono">{v}</span>
                </span>
              ))}
            </div>

            <MetaInfo table={table} />

            {table.columns.length > 0 ? (
              <DataTable table={table} columns={editedColumns} onColumnRename={handleColumnRename} />
            ) : (
              <div className="border border-neutral-200 px-6 py-8 text-center text-xs text-neutral-400">
                Format <span className="font-mono text-neutral-700">{table.format}</span> terdeteksi, namun parser belum dapat mengekstrak tabel.
                Periksa data mentah di bawah.
              </div>
            )}

            {table.columns.length > 0 && table.rows.length > 0 && (
              <DatawrapperPanel table={table} columns={editedColumns} />
            )}

            {rawData && (
              <div className="border border-neutral-200 overflow-hidden">
                <button
                  onClick={() => setShowRaw((s) => !s)}
                  className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 transition-colors"
                >
                  <span>Lihat Data Mentah (JSON)</span>
                  {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showRaw && (
                  <pre className="bg-neutral-950 text-neutral-300 text-xs p-4 overflow-auto max-h-64 font-mono border-t border-neutral-200">
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-6 border-t border-neutral-100">
        <p className="text-xs text-neutral-400">
          Data bersumber dari{" "}
          <a href="https://webapi.bps.go.id" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-700 underline underline-offset-2">BPS Web API</a>
          . Visualisasi via{" "}
          <a href="https://www.datawrapper.de" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-700 underline underline-offset-2">Datawrapper</a>
          . StatNusa © 2025
        </p>
      </footer>
    </div>
  );
}
