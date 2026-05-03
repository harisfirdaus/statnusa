import { useState } from "react";
import { Search, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

// ── Amber Phosphor ─────────────────────────────────────────────
// Emotional register: warm, nostalgic, tactile. Like staring at a
// 1982 VT100 running a Badan Pusat Statistik mainframe query.
// Every value feels hand-typed. The glow is earned.
// ──────────────────────────────────────────────────────────────
const MONO   = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const BG     = "#0d0800";
const PANEL  = "#120b00";
const INPUT  = "#080500";
const AMBER  = "#d97706";   // primary amber
const BRIGHT = "#fbbf24";   // highlight
const LIGHT  = "#fde68a";   // input text / readable
const DIM    = "#78350f";   // muted
const BORDER = "#451a03";   // border

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
            <span className="w-20 text-right flex-shrink-0 truncate" style={{ color: "#fcd34d" }}>{label.slice(0,12)}</span>
            <span style={{ color: AMBER }}>{bar}</span>
            <span style={{ color: LIGHT }}>{value.toFixed(2)}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-2 text-xs mt-2 pt-2" style={{ borderTop: `1px solid ${BORDER}`, fontFamily: MONO }}>
        <span className="w-20 flex-shrink-0" />
        <span style={{ color: DIM }}>0%{"        "}4%{"       "}8%</span>
      </div>
      <div className="text-xs mt-0.5" style={{ fontFamily: MONO, color: BRIGHT }}>
        &gt; NASIONAL=4.74% · N=38 · src=Sakernas · th=2025q4
      </div>
    </div>
  );
}

export function VibeAmber() {
  const [url, setUrl]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  }

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: MONO, color: AMBER }}>

      {/* Header */}
      <header style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Retro blinking cursor logo */}
            <span className="text-sm font-bold" style={{ color: BRIGHT }}>
              ▶ StatNusa
            </span>
            <span className="text-xs px-2 py-0.5" style={{ color: DIM, border: `1px solid ${DIM}` }}>v2.0.0</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="animate-pulse" style={{ color: BRIGHT }}>▌</span>
            <span style={{ color: DIM }}>READY</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Preview panel */}
        <div className="p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <div className="text-xs mb-3" style={{ color: DIM }}>
            <span style={{ color: BRIGHT }}>C:\BPS&gt;</span> query.exe --dataset=TPT --period=2025q4
          </div>
          <div className="text-xs mb-1" style={{ color: BRIGHT }}>
            TPT_MENURUT_PROVINSI · 2025-Q4 · N=38 · unit=Persen
          </div>
          <div className="text-xs mb-3" style={{ color: DIM }}>{"═".repeat(60)}</div>
          <PreviewChart />
          <div className="mt-3 pt-3 text-xs" style={{ borderTop: `1px solid ${BORDER}`, color: DIM }}>
            [200 OK] 38 records · last_update=2026-02-06 · src=Sakernas,BPS
          </div>
        </div>

        {/* URL input */}
        <div className="p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <div className="text-xs mb-3" style={{ color: DIM }}>
            <span style={{ color: BRIGHT }}>C:\BPS&gt;</span> query.exe --url=
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
                style={{ background: "#451a03", color: LIGHT, border: `1px solid ${AMBER}` }}>
                {loading
                  ? <><Loader2 className="w-3 h-3 animate-spin" />RUNNING…</>
                  : <><Search className="w-3 h-3" />EXECUTE.EXE</>}
              </button>
            </div>
          </form>
          <div className="flex items-center gap-2 flex-wrap mt-3 text-xs" style={{ color: DIM }}>
            <span>presets:</span>
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setUrl(`bps://preset/${p}`)}
                className="px-2 py-0.5"
                style={{ border: `1px solid ${BORDER}`, color: BRIGHT }}>
                {p}
              </button>
            ))}
          </div>
        </div>

      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-xs" style={{ color: DIM }}>
          src:{" "}
          <a href="https://webapi.bps.go.id" target="_blank" rel="noopener noreferrer"
            className="underline" style={{ color: AMBER }}>webapi.bps.go.id</a>
          {" · "}viz:{" "}
          <a href="https://www.datawrapper.de" target="_blank" rel="noopener noreferrer"
            className="underline" style={{ color: AMBER }}>datawrapper.de</a>
          {" · "}StatNusa © 2025
        </p>
      </footer>
    </div>
  );
}
