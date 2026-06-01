import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Loader2, AlertCircle, ChevronDown, ChevronUp, Database, Sun, Moon, BarChart3, MessageCircle, ExternalLink, ArrowDown } from "lucide-react";
import { fetchBpsData } from "@/lib/api";
import { parseData, mergeMultiYear } from "@/lib/parsers";
import { MetaInfo } from "@/components/MetaInfo";
import { DataTable } from "@/components/DataTable";
import { DatawrapperPanel } from "@/components/DatawrapperPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { useDarkMode } from "@/hooks/useDarkMode";
import type { ParsedTable } from "@/lib/parsers";

function isStandardBpsUrl(rawUrl: string): boolean {
  return (
    rawUrl.includes("/list/model/data") &&
    !rawUrl.includes("interoperabilitas/datasource/simdasi")
  );
}

function hasYearRange(rawUrl: string): boolean {
  return /th\/\d+-\d+/.test(rawUrl);
}

function toAllYearsUrl(rawUrl: string): string {
  if (!isStandardBpsUrl(rawUrl) || hasYearRange(rawUrl)) return rawUrl;
  return rawUrl.replace(/th\/(\d+)/, (_, n) => `th/${parseInt(n, 10) - 1}-${n}`);
}

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

export default function Home() {
  const urlInputRef = useRef<HTMLDivElement>(null);
  const { dark, toggle }                  = useDarkMode();
  const [url, setUrl]                     = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [rawData, setRawData]             = useState<unknown>(null);
  const [table, setTable]                 = useState<ParsedTable | null>(null);
  const [editedColumns, setEditedColumns] = useState<string[]>([]);
  const [showRaw, setShowRaw]             = useState(false);
  const [fetchAllYears, setFetchAllYears] = useState(false);

  const [yearTables, setYearTables]       = useState<ParsedTable[]>([]);
  const [rawDataList, setRawDataList]     = useState<unknown[]>([]);
  const [addYearUrl, setAddYearUrl]       = useState("");
  const [showAddYearInput, setShowAddYearInput] = useState(false);
  const [addYearLoading, setAddYearLoading] = useState(false);
  const [addYearError, setAddYearError]   = useState<string | null>(null);

  useEffect(() => {
    if (table) setEditedColumns([...table.columns]);
  }, [table]);

  useEffect(() => {
    if (!isStandardBpsUrl(url) || hasYearRange(url)) {
      setFetchAllYears(false);
    }
  }, [url]);

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
    setRawDataList([]);
    setYearTables([]);
    setShowRaw(false);
    setAddYearUrl("");
    setShowAddYearInput(false);
    setAddYearError(null);
    try {
      const urlToFetch = fetchAllYears ? toAllYearsUrl(trimmed) : trimmed;
      const result = await fetchBpsData(urlToFetch);
      setRawData(result.data);
      const parsed = parseData(result.data);
      const newYearTables = [parsed];
      setYearTables(newYearTables);
      setTable(mergeMultiYear(newYearTables));
      setRawDataList([result.data]);
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddYear() {
    const trimmed = addYearUrl.trim();
    if (!trimmed || addYearLoading) return;
    setAddYearLoading(true);
    setAddYearError(null);
    try {
      const result = await fetchBpsData(trimmed);
      const parsed = parseData(result.data);

      if (yearTables.length > 0 && parsed.format !== yearTables[0].format) {
        throw new Error(
          `Format data berbeda (${parsed.format} vs ${yearTables[0].format}). Tidak dapat digabungkan.`
        );
      }

      const newYearTables = [...yearTables, parsed];
      setYearTables(newYearTables);
      setTable(mergeMultiYear(newYearTables));
      setRawDataList((prev) => [...prev, result.data]);
      setAddYearUrl("");
      setShowAddYearInput(false);
    } catch (err: any) {
      setAddYearError(err.message ?? "Gagal mengambil data tambahan.");
    } finally {
      setAddYearLoading(false);
    }
  }

  function removeYear(index: number) {
    const newYearTables = yearTables.filter((_, i) => i !== index);
    setYearTables(newYearTables);
    setTable(mergeMultiYear(newYearTables));
    setRawDataList((prev) => prev.filter((_, i) => i !== index));
  }

  const incompleteRowCount = useMemo(() => {
    if (!table || yearTables.length <= 1) return 0;
    const expectedDataCols = table.columns.length - 1;
    return table.rows.filter((row) => {
      const nullCount = row.slice(1).filter((v) => v === null).length;
      return nullCount > 0 && nullCount < expectedDataCols;
    }).length;
  }, [table, yearTables.length]);

  return (
    <div className="min-h-screen bg-background dark:bg-neutral-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-700 bg-background dark:bg-neutral-900">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight tracking-tight">StatNusa</h1>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Ekstrak &amp; Visualisasi Data Badan Pusat Statistik</p>
          </div>
          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Landing page */}
        {!table && !loading && !error && (
          <div className="space-y-4">

            {/* Hero */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-6 py-10 text-center space-y-4">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                Visualisasi Data Statistik Indonesia
              </h2>
              <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
                Tempel URL data Badan Pusat Statistik, dapatkan tabel dan grafik siap analisis dalam hitungan detik.
              </p>
              <button
                onClick={() => urlInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-white transition-colors rounded-md mt-2"
              >
                Mulai Sekarang
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Cara Pakai */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <div className="px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-5">
                  Cara Pakai
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { num: "1", title: "Cari URL Data", desc: "Buka web BPS, salin link tabel statistik yang diinginkan." },
                    { num: "2", title: "Tempel di sini", desc: "Masukkan URL BPS pada kolom input di bawah." },
                    { num: "3", title: "Analisis dan Visual", desc: "Lihat tabel interaktif, buat grafik Datawrapper, dan tanya AI soal data." },
                  ].map((step, i, arr) => (
                    <div key={step.num} className="relative flex gap-3">
                      {i < arr.length - 1 && (
                        <div className="hidden sm:block absolute top-3 left-[1.125rem] w-full h-px bg-neutral-200 dark:bg-neutral-700 -z-10" style={{ width: "calc(100% + 1.5rem)" }} />
                      )}
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center text-xs font-bold relative z-0">
                        {step.num}
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{step.title}</h3>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fitur */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <div className="px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-5">
                  Fitur
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: BarChart3, title: "Tabel dan Grafik", desc: "Parsing otomatis data BPS ke tabel interaktif" },
                    { icon: MessageCircle, title: "Tanya AI", desc: "Chat dengan model AI tentang data yang sedang dilihat" },
                    { icon: ExternalLink, title: "Datawrapper", desc: "Ekspor chart ke Datawrapper dengan satu klik" },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="group p-5 rounded-lg border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all cursor-default">
                      <div className="w-9 h-9 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                        <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">{title}</h3>
                      <p className="text-sm text-neutral-400 dark:text-neutral-500 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* URL Input */}
        <div ref={urlInputRef} className="border border-neutral-200 dark:border-neutral-700 p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Masukkan URL Data JSON BPS
          </h2>
          <form onSubmit={handleFetch} className="space-y-3">
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://webapi.bps.go.id/v1/api/list/model/data/..."
              rows={2}
              className="w-full px-3 py-2.5 text-xs border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300 resize-none font-mono text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 transition-colors"
              disabled={loading}
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-white transition-colors tracking-wide disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Mengambil data…</>
                  : <><Search className="w-3.5 h-3.5" />AMBIL DATA</>}
              </button>
              {table && (
                <button
                  type="button"
                  onClick={() => {
                    setTable(null); setRawData(null); setRawDataList([]);
                    setYearTables([]); setUrl(""); setError(null);
                    setAddYearUrl(""); setShowAddYearInput(false); setAddYearError(null);
                    setFetchAllYears(false);
                  }}
                  className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fetchAllYears"
                checked={fetchAllYears}
                onChange={(e) => setFetchAllYears(e.target.checked)}
                disabled={loading || !isStandardBpsUrl(url) || hasYearRange(url)}
                className="accent-neutral-900 dark:accent-neutral-100"
              />
              <label
                htmlFor="fetchAllYears"
                className={`text-xs select-none ${
                  loading || !isStandardBpsUrl(url) || hasYearRange(url)
                    ? "text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                    : "text-neutral-600 dark:text-neutral-400 cursor-pointer"
                }`}
                title={
                  hasYearRange(url)
                    ? "URL sudah berisi rentang tahun"
                    : !isStandardBpsUrl(url)
                      ? "Hanya untuk URL BPS standar"
                      : "Ambil seluruh data historis dari BPS sekaligus"
                }
              >
                Ambil data dari semua tahun yang tersedia
              </label>
            </div>
          </form>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-400 dark:text-neutral-500 mr-1">Contoh:</span>
            {EXAMPLE_URLS.map((ex) => (
              <button
                key={ex.url}
                onClick={() => setUrl(ex.url)}
                className="text-xs px-3 py-1 border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-900 dark:hover:border-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-semibold text-xs text-red-700 dark:text-red-400">Gagal mengambil data</p>
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {table && editedColumns.length > 0 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{table.title}</h2>
              {(table.source || table.unit) && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
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
                <span key={l} className="flex items-center gap-1.5 text-xs border border-neutral-200 dark:border-neutral-700 px-3 py-1">
                  <span className="text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-semibold">{l}</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-mono">{v}</span>
                </span>
              ))}
            </div>

            {yearTables.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-semibold">Tahun:</span>
                  {yearTables.map((yt, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs border border-neutral-200 dark:border-neutral-700 px-2 py-0.5">
                      <span className="text-neutral-700 dark:text-neutral-300 font-mono">{yt.yearLabel || `Data ${i + 1}`}</span>
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => removeYear(i)}
                          className="text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors leading-none"
                          title="Hapus tahun ini"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {yearTables.length < 5 && !showAddYearInput && (
                    <button
                      type="button"
                      onClick={() => setShowAddYearInput(true)}
                      className="text-xs px-2 py-0.5 border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-900 dark:hover:border-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      + Tambah Data Tahun Lain
                    </button>
                  )}
                </div>

                {showAddYearInput && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={addYearUrl}
                      onChange={(e) => setAddYearUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddYear(); }}
                      placeholder="URL data tahun lain…"
                      className="flex-1 px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300 font-mono text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddYear}
                      disabled={!addYearUrl.trim() || addYearLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {addYearLoading ? <><Loader2 className="w-3 h-3 animate-spin" />Memuat…</> : "Ambil"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddYearInput(false); setAddYearUrl(""); setAddYearError(null); }}
                      className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2"
                    >
                      Batal
                    </button>
                  </div>
                )}

                {addYearError && (
                  <div className="text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2">
                    {addYearError}
                  </div>
                )}
              </div>
            )}

            {incompleteRowCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{incompleteRowCount} baris memiliki data tidak lengkap (wilayah tidak tersedia di semua tahun).</span>
              </div>
            )}

            <MetaInfo table={table} />

            {table.columns.length > 0 ? (
              <DataTable table={table} columns={editedColumns} onColumnRename={handleColumnRename} />
            ) : (
              <div className="border border-neutral-200 dark:border-neutral-700 px-6 py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                Format <span className="font-mono text-neutral-700 dark:text-neutral-300">{table.format}</span> terdeteksi, namun parser belum dapat mengekstrak tabel.
                Periksa data mentah di bawah.
              </div>
            )}

            {table.columns.length > 0 && table.rows.length > 0 && (
              <DatawrapperPanel table={table} columns={editedColumns} />
            )}

            {table.columns.length > 0 && table.rows.length > 0 && (
              <ChatPanel table={table} columns={editedColumns} />
            )}

            {rawData != null && (
              <div className="border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <button
                  onClick={() => setShowRaw((s) => !s)}
                  className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span>Lihat Data Mentah (JSON)</span>
                  {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showRaw && (
                  <pre className="bg-neutral-950 text-neutral-300 text-xs p-4 overflow-auto max-h-64 font-mono border-t border-neutral-700">
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-6 border-t border-neutral-100 dark:border-neutral-800">
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Data dari{" "}
          <a href="https://www.bps.go.id/id" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2">BPS</a>
          . Integrasi via{" "}
          <a href="https://webapi.bps.go.id" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2">BPS Web API</a>
          . Visualisasi via{" "}
          <a href="https://www.datawrapper.de" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2">Datawrapper</a>
          . StatNusa © 2026
        </p>
      </footer>
    </div>
  );
}
