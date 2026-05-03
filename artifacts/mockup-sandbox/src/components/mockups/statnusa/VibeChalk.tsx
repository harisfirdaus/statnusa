import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

// ── Chalk Print ────────────────────────────────────────────────
// Emotional register: quiet, editorial, intellectually serious.
// Like a printed statistical annex from a government gazette —
// monospaced type on off-white paper. Nothing decorative survives.
// The data speaks; the interface steps back.
// ──────────────────────────────────────────────────────────────
const MONO   = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const BG     = "#f5f0e8";   // warm paper
const PANEL  = "#ede8df";   // slightly darker paper for cards
const INPUT  = "#faf7f2";   // lighter for inputs
const INK    = "#1c1917";   // primary text
const MUTED  = "#44403c";   // secondary text
const DIM    = "#a8a29e";   // very muted / labels
const BORDER = "#c7bfb0";   // subtle border
const ACCENT = "#15803d";   // dark forest green accent
const BRIGHT = "#166534";   // deep green for highlights

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
        // Use dot/hash pattern for printed feel
        const bar    = "▓".repeat(filled) + "░".repeat(28 - filled);
        return (
          <div key={label} className="flex items-center gap-2 text-xs" style={{ fontFamily: MONO }}>
            <span className="w-20 text-right flex-shrink-0 truncate" style={{ color: MUTED }}>{label.slice(0,12)}</span>
            <span style={{ color: ACCENT }}>{bar}</span>
            <span style={{ color: INK }}>{value.toFixed(2)}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-2 text-xs mt-2 pt-2" style={{ borderTop: `1px solid ${BORDER}`, fontFamily: MONO }}>
        <span className="w-20 flex-shrink-0" />
        <span style={{ color: DIM }}>0%{"        "}4%{"       "}8%</span>
      </div>
      <div className="text-xs mt-0.5" style={{ fontFamily: MONO, color: BRIGHT }}>
        Nasional: 4,74% · N=38 · Sakernas 2025-Q4
      </div>
    </div>
  );
}

export function VibeChalk() {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);

  function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  }

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: MONO, color: INK }}>

      {/* Header — minimal rule, no color blocks */}
      <header style={{ borderBottom: `2px solid ${INK}` }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-4">
            <span className="text-base font-bold tracking-tight" style={{ color: INK }}>StatNusa</span>
            <span className="text-xs" style={{ color: DIM }}>Alat Eksplorasi Data BPS</span>
          </div>
          <div className="text-[10px]" style={{ color: DIM }}>
            webapi.bps.go.id · datawrapper.de
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Preview panel — looks like a printed table */}
        <div className="p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          {/* Caption style */}
          <div className="text-[10px] mb-2 uppercase tracking-widest" style={{ color: DIM }}>
            Tabel 1. Tingkat Pengangguran Terbuka menurut Provinsi
          </div>
          <div className="text-xs mb-1 font-bold" style={{ color: INK }}>
            TPT_MENURUT_PROVINSI · Triwulan IV 2025 · N=38 · Satuan: Persen
          </div>
          <div className="text-xs mb-3" style={{ color: DIM }}>{"─".repeat(60)}</div>
          <PreviewChart />
          <div className="mt-3 pt-3 text-[10px]" style={{ borderTop: `1px solid ${BORDER}`, color: DIM }}>
            Sumber: Sakernas, BPS. Diperbarui: 6 Februari 2026.
          </div>
        </div>

        {/* URL input — newspaper classified form aesthetic */}
        <div className="p-4" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          <div className="text-[10px] mb-3 uppercase tracking-widest" style={{ color: DIM }}>
            Masukkan URL API BPS
          </div>
          <form onSubmit={handleFetch} className="space-y-3">
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://webapi.bps.go.id/v1/api/list/model/data/..."
              rows={3}
              className="w-full px-3 py-2 text-xs resize-none focus:outline-none"
              style={{
                background: INPUT,
                border: `1px solid ${BORDER}`,
                borderBottom: `2px solid ${INK}`,
                color: INK,
                fontFamily: MONO,
              }}
              disabled={loading}
            />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold disabled:opacity-40"
                style={{
                  background: INK,
                  color: BG,
                  border: "none",
                }}>
                {loading
                  ? <><Loader2 className="w-3 h-3 animate-spin" />Mengambil data…</>
                  : <><Search className="w-3 h-3" />Ambil Data</>}
              </button>
            </div>
          </form>

          {/* Preset links — understated like footnote references */}
          <div className="flex items-center gap-3 flex-wrap mt-3 text-xs" style={{ color: DIM }}>
            <span>Contoh:</span>
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setUrl(`bps://preset/${p}`)}
                className="underline decoration-dotted text-xs"
                style={{ color: ACCENT }}>
                {p}
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* Footer — printed colophon */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-4"
        style={{ borderTop: `2px solid ${INK}` }}>
        <div className="flex items-baseline justify-between text-[10px]" style={{ color: DIM }}>
          <span>StatNusa © 2025</span>
          <span>
            Sumber data: <a href="https://webapi.bps.go.id" target="_blank" rel="noopener noreferrer"
              style={{ color: ACCENT }}>Badan Pusat Statistik</a>
            {" · "}Visualisasi: <a href="https://www.datawrapper.de" target="_blank" rel="noopener noreferrer"
              style={{ color: ACCENT }}>Datawrapper</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
