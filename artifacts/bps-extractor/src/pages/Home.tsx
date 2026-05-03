import { useState, useEffect } from "react";
import { Search, Loader2, AlertCircle, ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { fetchBpsData } from "@/lib/api";
import { parseData } from "@/lib/parsers";
import { MetaInfo } from "@/components/MetaInfo";
import { DataTable } from "@/components/DataTable";
import { DatawrapperPanel } from "@/components/DatawrapperPanel";
import type { ParsedTable } from "@/lib/parsers";

const MONO = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const BG      = "#0a0f0a";
const PANEL   = "#0d130d";
const INPUT   = "#060c06";
const GREEN   = "#22c55e";
const BRIGHT  = "#4ade80";
const LIGHT   = "#86efac";
const DIM     = "#166534";
const BORDER  = "#14532d";

// ── Preview chart: TPT per Provinsi, November 2025 ──
const PREVIEW_BARS = [
  { label: "Papua",            value: 7.08 },
  { label: "Jawa Barat",       value: 6.66 },
  { label: "Banten",           value: 6.63 },
  { label: "Papua Barat Daya", value: 6.56 },
  { label: "Kep. Riau",        value: 6.35 },
  { label: "DKI Jakarta",      value: 6.31 },
  { label: "Maluku",           value: 6.11 },
  { label: "Sulawesi Utara",   value: 5.78 },
];
const NATIONAL_RATE = 4.74;
const MAX_BAR = 8;

function PreviewChart() {
  return (
    <div className="space-y-1.5">
      {PREVIEW_BARS.map(({ label, value }) => {
        const pct   = (value / MAX_BAR) * 100;
        const filled = Math.round((pct / 100) * 28);
        const bar    = "█".repeat(filled) + "░".repeat(28 - filled);
        return (
          <div key={label} className="flex items-center gap-2 text-xs" style={{ fontFamily: MONO }}>
            <span className="w-20 text-right flex-shrink-0 truncate" style={{ color: "#6ee7b7" }}>
              {label.slice(0, 12)}
            </span>
            <span style={{ color: GREEN }}>{bar}</span>
            <span style={{ color: LIGHT }}>{value.toFixed(2)}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-2 text-xs mt-2 pt-2" style={{ borderTop: `1px solid ${BORDER}`, fontFamily: MONO }}>
        <span className="w-20 flex-shrink-0" />
        <span style={{ color: DIM }}>0%{"        "}4%{"       "}8%</span>
      </div>
      <div className="text-xs mt-0.5" style={{ fontFamily: MONO, color: BRIGHT }}>
        &gt; NASIONAL={NATIONAL_RATE}% · N=38 · src=Sakernas · th=2025q4
      </div>
    </div>
  );
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
  const [url, setUrl]                   = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [rawData, setRawData]           = useState<unknown>(null);
  const [table, setTable]               = useState<ParsedTable | null>(null);
  const [editedColumns, setEditedColumns] = useState<string[]>([]);
  const [showRaw, setShowRaw]           = useState(false);

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
    <div className="min-h-screen" style={{ background: BG, fontFamily: MONO, color: GREEN }}>

      {/* Header */}
      <header style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 flex-shrink-0" style={{ color: BRIGHT }} />
            <span className="text-sm font-bold" style={{ color: BRIGHT }}>StatNusa</span>
            <span className="text-xs px-2 py-0.5" style={{ color: DIM, border: `1px solid ${DIM}` }}>v2.0.0</span>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: DIM }}>
            <span style={{ color: GREEN }}>● READY</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Hero preview */}
        {!table && !loading && !error && (
          <div className="p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
            <div className="text-xs mb-3" style={{ color: DIM }}>
              <span style={{ color: BRIGHT }}>$</span> statnusa --preview --dataset=TPT --period=2025q4
            </div>
            <div className="text-xs mb-1" style={{ color: BRIGHT }}>
              TPT_MENURUT_PROVINSI · 2025-Q4 · N=38 · unit=Persen
            </div>
            <div className="text-xs mb-3" style={{ color: DIM }}>{"─".repeat(60)}</div>
            <PreviewChart />
            <div className="mt-3 pt-3 text-xs" style={{ borderTop: `1px solid ${BORDER}`, color: DIM }}>
              [OK] 38 obs loaded · last_update=2026-02-06 · src=Sakernas,BPS
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <div className="text-xs mb-3" style={{ color: DIM }}>
            <span style={{ color: BRIGHT }}>$</span> statnusa fetch --url=
          </div>
          <form onSubmit={handleFetch} className="space-y-3">
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://webapi.bps.go.id/v1/api/list/model/data/..."
              rows={3}
              className="w-full px-3 py-2 text-xs resize-none focus:outline-none"
              style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO }}
              disabled={loading}
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold transition-colors disabled:opacity-50"
                style={{ background: DIM, color: "#dcfce7", border: "none", cursor: loading || !url.trim() ? "not-allowed" : "pointer" }}
              >
                {loading
                  ? <><Loader2 className="w-3 h-3 animate-spin" />[FETCHING]</>
                  : <><Search className="w-3 h-3" />[EXECUTE]</>}
              </button>
              {loading && <span className="text-xs" style={{ color: DIM }}>Mengambil dari BPS API…</span>}
            </div>
          </form>
          <div className="flex items-center gap-2 flex-wrap mt-3 text-xs" style={{ color: DIM }}>
            <span>presets:</span>
            {EXAMPLE_URLS.map((ex) => (
              <button
                key={ex.url}
                onClick={() => setUrl(ex.url)}
                className="px-2 py-0.5 transition-colors"
                style={{ border: `1px solid ${BORDER}`, color: BRIGHT, background: "transparent" }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 text-sm"
            style={{ background: "#1a0000", border: "1px solid #7f1d1d", color: "#fca5a5", fontFamily: MONO }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-bold text-xs text-red-400">[ERROR] Gagal mengambil data</p>
              <p className="mt-0.5 text-xs text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {table && editedColumns.length > 0 && (
          <div className="space-y-4">
            {/* Status + meta */}
            <div className="text-xs space-y-0.5" style={{ color: DIM }}>
              <div><span style={{ color: BRIGHT }}>[OK]</span> dataset loaded</div>
              <div style={{ color: GREEN }}>&gt; title: {table.title}</div>
              <div>rows={table.rows.length} · cols={table.columns.length}</div>
            </div>

            <MetaInfo table={table} />

            {table.columns.length > 0 ? (
              <div style={{ border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div className="px-4 py-2 text-xs" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}`, color: BRIGHT }}>
                  DATA TABLE
                </div>
                <div style={{ background: BG }}>
                  <DataTable
                    table={table}
                    columns={editedColumns}
                    onColumnRename={handleColumnRename}
                  />
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-xs"
                style={{ border: `1px solid ${BORDER}`, color: DIM, fontFamily: MONO }}>
                [WARN] Format <span style={{ color: GREEN }}>{table.format}</span> terdeteksi, namun parser belum dapat mengekstrak tabel.
                Periksa data mentah di bawah.
              </div>
            )}

            {table.columns.length > 0 && table.rows.length > 0 && (
              <DatawrapperPanel table={table} columns={editedColumns} />
            )}

            {rawData && (
              <div style={{ border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <button
                  onClick={() => setShowRaw((s) => !s)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors"
                  style={{ background: PANEL, color: GREEN }}
                >
                  <span>[RAW_JSON]</span>
                  {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showRaw && (
                  <pre className="text-xs p-4 overflow-auto max-h-80" style={{ background: INPUT, color: BRIGHT, fontFamily: MONO }}>
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-xs" style={{ color: DIM }}>
          src:{" "}
          <a href="https://webapi.bps.go.id" target="_blank" rel="noopener noreferrer"
            className="underline" style={{ color: GREEN }}>webapi.bps.go.id</a>
          {" · "}viz:{" "}
          <a href="https://www.datawrapper.de" target="_blank" rel="noopener noreferrer"
            className="underline" style={{ color: GREEN }}>datawrapper.de</a>
          {" · "}StatNusa © 2025
        </p>
      </footer>
    </div>
  );
}
