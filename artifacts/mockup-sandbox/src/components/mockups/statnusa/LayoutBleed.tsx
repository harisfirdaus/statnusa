import { useState } from "react";
import { Search, Loader2, BarChart2, Terminal, ChevronDown, ChevronUp, Download } from "lucide-react";

const MONO   = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const BG     = "#0a0f0a";
const PANEL  = "#0d130d";
const INPUT  = "#060c06";
const GREEN  = "#22c55e";
const BRIGHT = "#4ade80";
const LIGHT  = "#86efac";
const DIM    = "#166534";
const BORDER = "#14532d";

const PREVIEW_BARS = [
  { label: "Papua",           value: 7.08 },
  { label: "Jawa Barat",      value: 6.66 },
  { label: "Banten",          value: 6.63 },
  { label: "Papua Barat Dy.", value: 6.56 },
  { label: "Kep. Riau",       value: 6.35 },
  { label: "DKI Jakarta",     value: 6.31 },
  { label: "Maluku",          value: 6.11 },
  { label: "Sulawesi Utara",  value: 5.78 },
  { label: "Aceh",            value: 5.60 },
  { label: "Sumatera Barat",  value: 5.52 },
];

const MOCK_ROWS = [
  ["Papua","7.08"],["Jawa Barat","6.66"],["Banten","6.63"],["Papua Barat Daya","6.56"],
  ["Kep. Riau","6.35"],["DKI Jakarta","6.31"],["Maluku","6.11"],["Sulawesi Utara","5.78"],
  ["Aceh","5.60"],["Sumatera Barat","5.52"],["Sumatera Utara","5.28"],["Kalimantan Timur","5.20"],
  ["Maluku Utara","5.15"],["Sulawesi Selatan","5.10"],["NTT","4.95"],["NTB","4.88"],
];

export function LayoutBleed() {
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [showDW, setShowDW] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setHasData(true); }, 1200);
  }

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: MONO, color: GREEN }}>

      {/* ── STICKY TOP BAR — full-width inline input ── */}
      <div className="sticky top-0 z-20" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <form onSubmit={handleFetch} className="flex items-center gap-0">
          <div className="flex items-center gap-3 px-6 py-3 flex-shrink-0"
            style={{ borderRight: `1px solid ${BORDER}` }}>
            <Terminal className="w-3.5 h-3.5" style={{ color: BRIGHT }} />
            <span className="text-sm font-bold" style={{ color: BRIGHT }}>StatNusa</span>
          </div>
          <div className="flex-1 flex items-center px-4" style={{ color: DIM }}>
            <span className="text-xs mr-2 flex-shrink-0"><span style={{ color: BRIGHT }}>$</span> fetch</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://webapi.bps.go.id/v1/api/list/model/data/..."
              className="flex-1 px-3 py-2 text-xs focus:outline-none"
              style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO }}
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading || !url.trim()}
            className="flex items-center gap-2 px-6 py-3 text-xs font-bold flex-shrink-0 disabled:opacity-40"
            style={{ background: DIM, color: "#dcfce7", borderLeft: `1px solid ${BORDER}` }}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            {loading ? "[FETCHING]" : "[RUN]"}
          </button>
          {hasData && (
            <button type="button" onClick={() => { setHasData(false); setUrl(""); }}
              className="px-4 py-3 text-xs flex-shrink-0"
              style={{ color: DIM, borderLeft: `1px solid ${BORDER}` }}>[RESET]</button>
          )}
        </form>
        {/* Preset chips */}
        <div className="flex items-center gap-2 px-6 py-1.5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <span className="text-[10px]" style={{ color: DIM }}>presets:</span>
          {["Pengangguran","Umur Harapan Hidup","Kemiskinan"].map((p) => (
            <button key={p} onClick={() => setUrl(`bps://preset/${p}`)}
              className="text-[11px] px-2 py-0.5"
              style={{ border: `1px solid ${BORDER}`, color: BRIGHT }}>{p}</button>
          ))}
        </div>
      </div>

      {/* ── FULL-WIDTH CONTENT ── */}
      {!hasData ? (
        /* Preview — full bleed hero */
        <div>
          {/* Hero label row */}
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${BORDER}`, background: "#0b100b" }}>
            <div>
              <div className="text-xs" style={{ color: DIM }}>
                <span style={{ color: BRIGHT }}>$</span> statnusa --preview --dataset=TPT --period=2025q4
              </div>
              <div className="text-sm mt-1" style={{ color: BRIGHT }}>TPT_MENURUT_PROVINSI · 2025-Q4 · N=38</div>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div><span style={{ color: DIM }}>nasional=</span><span style={{ color: BRIGHT }}>4.74%</span></div>
              <div><span style={{ color: DIM }}>unit=</span><span style={{ color: GREEN }}>Persen</span></div>
              <div><span style={{ color: DIM }}>src=</span><span style={{ color: GREEN }}>Sakernas,BPS</span></div>
            </div>
          </div>

          {/* Full-width chart */}
          <div className="px-8 py-6 space-y-2">
            {PREVIEW_BARS.map(({ label, value }) => {
              const pct  = (value / 8) * 100;
              const bars = Math.round(pct / 100 * 56);
              const bar  = "█".repeat(bars) + "░".repeat(56 - bars);
              return (
                <div key={label} className="flex items-center gap-3 text-xs" style={{ fontFamily: MONO }}>
                  <span className="w-36 text-right flex-shrink-0" style={{ color: "#6ee7b7" }}>{label}</span>
                  <span style={{ color: GREEN }}>{bar}</span>
                  <span className="w-8" style={{ color: LIGHT }}>{value.toFixed(2)}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-3 text-xs mt-1">
              <span className="w-36 flex-shrink-0" />
              <span style={{ color: DIM }}>0{"             "}2{"             "}4{"             "}6{"             "}8%</span>
            </div>
          </div>
          <div className="px-8 pb-4 text-xs" style={{ color: DIM }}>
            [TIP] Tempel URL BPS di baris input di atas untuk memuat data nyata.
          </div>
        </div>
      ) : (
        /* Full-bleed results */
        <div>
          {/* Status strip */}
          <div className="px-6 py-2 text-xs flex items-center gap-4"
            style={{ background: "#0b1a0b", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ color: BRIGHT }}>[OK]</span>
            <span style={{ color: GREEN }}>Tingkat Pengangguran Terbuka menurut Provinsi (Triwulanan)</span>
            <span className="ml-auto flex items-center gap-4" style={{ color: DIM }}>
              <span>rows=38</span><span>cols=2</span><span>period=Nov 2025</span>
            </span>
          </div>

          {/* Section header */}
          <div className="px-6 py-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${BORDER}`, background: PANEL }}>
            <span className="text-xs font-bold" style={{ color: BRIGHT }}>DATA TABLE</span>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1 font-bold"
              style={{ background: DIM, color: "#dcfce7" }}>
              <Download className="w-3 h-3" />[CSV]
            </button>
          </div>

          {/* Full-width 4-col table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: MONO }}>
              <thead>
                <tr style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
                  <th className="px-6 py-2 text-left font-bold w-16" style={{ color: DIM }}>#</th>
                  <th className="px-6 py-2 text-left font-bold" style={{ color: BRIGHT }}>PROVINSI</th>
                  <th className="px-6 py-2 text-right font-bold" style={{ color: BRIGHT }}>TPT(%)</th>
                  <th className="px-6 py-2 text-left font-bold" style={{ color: BRIGHT }}>BAR</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ROWS.map(([prov, val], i) => {
                  const v     = parseFloat(val);
                  const bars  = Math.round((v / 8) * 20);
                  const bar   = "█".repeat(bars) + "░".repeat(20 - bars);
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? BG : "#0b100b" }}>
                      <td className="px-6 py-1.5 tabular-nums" style={{ color: DIM }}>{String(i).padStart(3,"0")}</td>
                      <td className="px-6 py-1.5" style={{ color: "#6ee7b7" }}>{prov}</td>
                      <td className="px-6 py-1.5 text-right tabular-nums font-bold" style={{ color: BRIGHT }}>{val}</td>
                      <td className="px-6 py-1.5 text-xs" style={{ color: GREEN }}>{bar}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Datawrapper + Raw sections */}
          <div style={{ borderTop: `2px solid ${BORDER}` }}>
            <button onClick={() => setShowDW(s => !s)}
              className="w-full px-6 py-3 text-xs flex items-center gap-2"
              style={{ background: PANEL, color: GREEN, borderBottom: `1px solid ${BORDER}` }}>
              <BarChart2 className="w-3 h-3" />
              {showDW ? "[-]" : "[+]"} DATAWRAPPER EXPORT
              {showDW ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showDW && (
              <div className="px-6 py-4 text-xs grid grid-cols-3 gap-6"
                style={{ background: "#0b100b", borderBottom: `1px solid ${BORDER}` }}>
                <div className="col-span-2">
                  <div style={{ color: DIM }} className="mb-2">title=
                    <input type="text" defaultValue="TPT menurut Provinsi, November 2025"
                      className="focus:outline-none px-2 py-1 ml-1 w-full mt-1"
                      style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO, fontSize: "11px" }} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div style={{ color: DIM }}>type=<select className="px-2 py-1 focus:outline-none ml-1"
                      style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO, fontSize: "11px" }}>
                      <option>d3-bars</option><option>column-chart</option><option>d3-lines</option>
                    </select></div>
                    <div style={{ color: DIM }}>rows=16 · cols=2</div>
                  </div>
                </div>
                <div className="flex items-end">
                  <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold"
                    style={{ background: DIM, color: "#dcfce7" }}>
                    <BarChart2 className="w-3 h-3" />[PUSH]
                  </button>
                </div>
              </div>
            )}
            <button onClick={() => setShowRaw(s => !s)}
              className="w-full px-6 py-3 text-xs flex items-center gap-2"
              style={{ background: PANEL, color: GREEN }}>
              {showRaw ? "[-]" : "[+]"} RAW_JSON
              {showRaw ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            {showRaw && (
              <pre className="px-6 py-4 text-[11px] overflow-auto max-h-48"
                style={{ background: INPUT, color: BRIGHT, fontFamily: MONO, borderTop: `1px solid ${BORDER}` }}>
                {`{"status":"OK","datacontent":{"320025620125328":6.66,...}}`}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
