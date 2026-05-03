import { useState } from "react";
import { Search, Loader2, Activity } from "lucide-react";

// ── Deep Ocean Blue ────────────────────────────────────────────
// Emotional register: cool, institutional, precise, authoritative.
// Like a Bloomberg terminal or Reuters data feed. Every number
// feels verified. The interface doesn't comfort you — it informs you.
// ──────────────────────────────────────────────────────────────
const MONO   = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const BG     = "#07090f";
const PANEL  = "#0a0e1a";
const INPUT  = "#060810";
const BLUE   = "#38bdf8";   // primary cyan-blue
const BRIGHT = "#7dd3fc";   // highlight
const LIGHT  = "#bae6fd";   // readable text
const DIM    = "#1e3a5f";   // muted
const BORDER = "#1e3a5f";   // border
const ACCENT = "#0ea5e9";   // mid accent

const PREVIEW_BARS = [
  { label: "Papua",        value: 7.08 },
  { label: "Jawa Barat",   value: 6.66 },
  { label: "Banten",       value: 6.63 },
  { label: "Papua Barat",  value: 6.56 },
  { label: "Kep. Riau",    value: 6.35 },
  { label: "DKI Jakarta",  value: 6.31 },
  { label: "Maluku",       value: 6.11 },
  { label: "Sulawesi U.",  value: 5.78 },
];

const PRESETS = ["Pengangguran","Umur Harapan Hidup","Kemiskinan"];

function PreviewChart() {
  return (
    <div className="space-y-1.5">
      {PREVIEW_BARS.map(({ label, value }) => {
        const filled = Math.round((value / 8) * 28);
        const bar    = "█".repeat(filled) + "░".repeat(28 - filled);
        return (
          <div key={label} className="flex items-center gap-2 text-xs" style={{ fontFamily: MONO }}>
            <span className="w-20 text-right flex-shrink-0 truncate" style={{ color: LIGHT }}>{label.slice(0,12)}</span>
            <span style={{ color: BLUE }}>{bar}</span>
            <span style={{ color: BRIGHT }}>{value.toFixed(2)}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-2 text-xs mt-2 pt-2" style={{ borderTop: `1px solid ${BORDER}`, fontFamily: MONO }}>
        <span className="w-20 flex-shrink-0" />
        <span style={{ color: DIM }}>0%{"        "}4%{"       "}8%</span>
      </div>
      <div className="text-xs mt-0.5" style={{ fontFamily: MONO, color: BRIGHT }}>
        &gt; NASIONAL=4.74% · N=38 · SRC=SAKERNAS · 2025Q4
      </div>
    </div>
  );
}

export function VibeOcean() {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);

  function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  }

  // Simulated live ticker
  const tickers = [
    { label: "TPT",  value: "4.74%", delta: "+0.02", up: false },
    { label: "AHH",  value: "74.5",  delta: "+0.3",  up: true  },
    { label: "MISKIN", value: "8.57%", delta: "-0.14", up: true },
  ];

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: MONO, color: BLUE }}>

      {/* Header */}
      <header style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-0 flex items-stretch">
          {/* Logo */}
          <div className="flex items-center gap-3 pr-6 py-3" style={{ borderRight: `1px solid ${BORDER}` }}>
            <Activity className="w-3.5 h-3.5" style={{ color: BRIGHT }} />
            <span className="text-sm font-bold" style={{ color: BRIGHT }}>StatNusa</span>
            <span className="text-[10px] px-1.5 py-0.5" style={{ color: DIM, border: `1px solid ${DIM}` }}>v2.0</span>
          </div>
          {/* Live ticker strip */}
          <div className="flex items-center gap-6 px-6 py-3 flex-1">
            {tickers.map((t) => (
              <div key={t.label} className="flex items-baseline gap-2 text-[11px]">
                <span style={{ color: DIM }}>{t.label}</span>
                <span style={{ color: BRIGHT }} className="font-bold">{t.value}</span>
                <span style={{ color: t.up ? "#4ade80" : "#f87171" }}>{t.delta}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center px-4 py-3 text-[10px]" style={{ borderLeft: `1px solid ${BORDER}`, color: ACCENT }}>
            ● LIVE
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Preview panel */}
        <div className="p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs" style={{ color: DIM }}>
              <span style={{ color: BRIGHT }}>STREAM</span> · TPT_PROVINSI · 2025-Q4
            </div>
            <div className="text-[10px] px-2 py-0.5" style={{ border: `1px solid ${DIM}`, color: DIM }}>
              LIVE DATA
            </div>
          </div>
          <div className="text-xs mb-1" style={{ color: BRIGHT }}>
            TINGKAT PENGANGGURAN TERBUKA · 38 PROVINSI · UNIT: PCT
          </div>
          <div className="text-xs mb-3" style={{ color: DIM }}>{"─".repeat(60)}</div>
          <PreviewChart />
          <div className="mt-3 pt-3 text-xs flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
            <span style={{ color: DIM }}>[200] 38 obs · t=2026-02-06</span>
            <span style={{ color: ACCENT }}>SRC: SAKERNAS, BPS</span>
          </div>
        </div>

        {/* Query input */}
        <div className="p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <div className="text-[10px] mb-3 flex items-center gap-2" style={{ color: DIM }}>
            <span style={{ color: BRIGHT }}>QUERY</span>
            <span>·</span>
            <span>BPS API v1</span>
            <span className="ml-auto" style={{ color: DIM }}>endpoint: POST /api/bps/fetch</span>
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
              <button type="submit" disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold disabled:opacity-50"
                style={{ background: DIM, color: LIGHT, border: "none" }}>
                {loading
                  ? <><Loader2 className="w-3 h-3 animate-spin" />QUERYING</>
                  : <><Search className="w-3 h-3" />EXECUTE</>}
              </button>
              <span className="text-[10px]" style={{ color: DIM }}>
                {loading ? "Awaiting API response…" : "Press ENTER or click EXECUTE"}
              </span>
            </div>
          </form>
          <div className="flex items-center gap-2 flex-wrap mt-3 text-[11px]" style={{ color: DIM }}>
            <span>SAVED QUERIES:</span>
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setUrl(`bps://preset/${p}`)}
                className="px-2 py-0.5 transition-colors"
                style={{ border: `1px solid ${BORDER}`, color: BLUE }}>
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-[10px] flex items-center gap-4" style={{ color: DIM }}>
          <span>SRC: <a href="https://webapi.bps.go.id" target="_blank" rel="noopener noreferrer"
            style={{ color: BLUE }}>WEBAPI.BPS.GO.ID</a></span>
          <span>VIZ: <a href="https://www.datawrapper.de" target="_blank" rel="noopener noreferrer"
            style={{ color: BLUE }}>DATAWRAPPER.DE</a></span>
          <span className="ml-auto">STATNUSA © 2025</span>
        </p>
      </footer>
    </div>
  );
}
