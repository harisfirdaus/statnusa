import { useState } from "react";
import { Search, Loader2, BarChart2, Terminal, ChevronDown, ChevronUp } from "lucide-react";

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
  { label: "Papua",        value: 7.08 },
  { label: "Jawa Barat",   value: 6.66 },
  { label: "Banten",       value: 6.63 },
  { label: "Papua Barat",  value: 6.56 },
  { label: "Kep. Riau",    value: 6.35 },
  { label: "DKI Jakarta",  value: 6.31 },
  { label: "Maluku",       value: 6.11 },
  { label: "Sulawesi U.",  value: 5.78 },
];

const MOCK_ROWS = [
  ["Papua","7.08"],["Jawa Barat","6.66"],["Banten","6.63"],["Papua Barat","6.56"],
  ["Kep. Riau","6.35"],["DKI Jakarta","6.31"],["Maluku","6.11"],["Sulawesi U.","5.78"],
  ["Aceh","5.60"],["Sumatera Barat","5.52"],["Sumatera Utara","5.28"],["Kaltim","5.20"],
];

const PRESETS = ["Pengangguran","Umur Harapan Hidup","Kemiskinan"];

export function LayoutSplit() {
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
    <div className="flex h-screen overflow-hidden" style={{ background: BG, fontFamily: MONO, color: GREEN }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside className="flex flex-col flex-shrink-0 w-64 overflow-y-auto"
        style={{ background: PANEL, borderRight: `1px solid ${BORDER}` }}>

        {/* Logo */}
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <Terminal className="w-3.5 h-3.5" style={{ color: BRIGHT }} />
          <span className="text-sm font-bold" style={{ color: BRIGHT }}>StatNusa</span>
          <span className="text-[10px] px-1.5 py-0.5 ml-auto" style={{ color: DIM, border: `1px solid ${DIM}` }}>v2.0</span>
        </div>

        {/* Prompt + input */}
        <div className="px-4 py-4 flex-1 space-y-4">
          <div className="text-xs" style={{ color: DIM }}>
            <span style={{ color: BRIGHT }}>$</span> fetch --url=
          </div>
          <form onSubmit={handleFetch} className="space-y-2">
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://webapi.bps.go.id/..."
              rows={4}
              className="w-full px-2 py-2 text-[11px] resize-none focus:outline-none"
              style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO }}
            />
            <button type="submit" disabled={loading || !url.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold disabled:opacity-40"
              style={{ background: DIM, color: "#dcfce7" }}>
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" />[FETCHING]</> : <><Search className="w-3 h-3" />[EXECUTE]</>}
            </button>
          </form>

          <div className="space-y-1">
            <p className="text-[10px]" style={{ color: DIM }}>presets:</p>
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setUrl(`bps://preset/${p}`)}
                className="block w-full text-left text-[11px] px-2 py-1 transition-colors"
                style={{ border: `1px solid ${BORDER}`, color: BRIGHT }}>
                &gt; {p}
              </button>
            ))}
          </div>

          {hasData && (
            <div className="space-y-1 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <div className="text-[10px]" style={{ color: DIM }}>session:</div>
              <div className="text-[11px]" style={{ color: GREEN }}>var=TPT_PROVINSI</div>
              <div className="text-[11px]" style={{ color: DIM }}>rows=38 · cols=2</div>
              <div className="text-[11px]" style={{ color: DIM }}>unit=Persen</div>
              <div className="text-[11px]" style={{ color: DIM }}>src=Sakernas,BPS</div>
              <button onClick={() => { setHasData(false); setUrl(""); }}
                className="text-[11px] underline mt-1" style={{ color: DIM }}>[CLEAR]</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-[10px]" style={{ borderTop: `1px solid ${BORDER}`, color: DIM }}>
          <div>src: webapi.bps.go.id</div>
          <div>viz: datawrapper.de</div>
        </div>
      </aside>

      {/* ── MAIN PANE ── */}
      <main className="flex-1 overflow-y-auto">

        {!hasData ? (
          /* Preview chart */
          <div className="p-6 space-y-4">
            <div className="text-xs" style={{ color: DIM }}>
              <span style={{ color: BRIGHT }}>$</span> statnusa --preview --dataset=TPT --period=2025q4
            </div>
            <div className="text-xs" style={{ color: BRIGHT }}>
              TPT_MENURUT_PROVINSI · 2025-Q4 · N=38 · unit=Persen
            </div>
            <div className="text-xs" style={{ color: DIM }}>{"─".repeat(50)}</div>
            <div className="space-y-1.5">
              {PREVIEW_BARS.map(({ label, value }) => {
                const filled = Math.round((value / 8) * 26);
                const bar    = "█".repeat(filled) + "░".repeat(26 - filled);
                return (
                  <div key={label} className="flex items-center gap-2 text-xs" style={{ fontFamily: MONO }}>
                    <span className="w-24 text-right flex-shrink-0" style={{ color: "#6ee7b7" }}>{label}</span>
                    <span style={{ color: GREEN }}>{bar}</span>
                    <span style={{ color: LIGHT }}>{value.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs" style={{ color: BRIGHT }}>
              &gt; NASIONAL=4.74% · N=38 · src=Sakernas · th=2025q4
            </div>
            <div className="text-xs" style={{ color: DIM }}>
              [←] Tempel URL BPS di sidebar untuk mengambil data nyata
            </div>
          </div>
        ) : (
          /* Results */
          <div className="space-y-0">
            {/* Status bar */}
            <div className="px-6 py-2 text-xs flex items-center gap-3"
              style={{ background: "#0b1a0b", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: BRIGHT }}>[OK]</span>
              <span style={{ color: GREEN }}>Tingkat Pengangguran Terbuka menurut Provinsi (Triwulanan)</span>
              <span className="ml-auto" style={{ color: DIM }}>Nov 2025</span>
            </div>

            {/* Table */}
            <div>
              <div className="px-6 py-2 text-xs flex items-center justify-between"
                style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: BRIGHT }}>DATA TABLE</span>
                <button className="text-[11px] px-2 py-0.5 font-bold" style={{ background: DIM, color: "#dcfce7" }}>[CSV]</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ fontFamily: MONO }}>
                  <thead>
                    <tr style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
                      <th className="px-4 py-2 text-left font-bold w-8" style={{ color: DIM }}>#</th>
                      <th className="px-4 py-2 text-left font-bold" style={{ color: BRIGHT }}>PROVINSI</th>
                      <th className="px-4 py-2 text-right font-bold" style={{ color: BRIGHT }}>TPT(%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ROWS.map(([prov, val], i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? BG : "#0b100b" }}>
                        <td className="px-4 py-1.5 tabular-nums" style={{ color: DIM }}>{String(i).padStart(3, "0")}</td>
                        <td className="px-4 py-1.5" style={{ color: "#6ee7b7" }}>{prov}</td>
                        <td className="px-4 py-1.5 text-right tabular-nums font-bold" style={{ color: BRIGHT }}>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Datawrapper */}
            <div style={{ borderTop: `1px solid ${BORDER}` }}>
              <button onClick={() => setShowDW(s => !s)}
                className="w-full px-6 py-2.5 flex items-center gap-2 text-xs"
                style={{ background: PANEL, color: GREEN }}>
                <BarChart2 className="w-3 h-3" />
                {showDW ? "[-]" : "[+]"} DATAWRAPPER EXPORT
              </button>
              {showDW && (
                <div className="px-6 py-4 space-y-3 text-xs" style={{ background: "#0b100b", borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ color: DIM }}>title=<input type="text" defaultValue="TPT menurut Provinsi, Nov 2025"
                    className="px-2 py-1 focus:outline-none w-64 ml-1 text-[11px]"
                    style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO }} /></div>
                  <div style={{ color: DIM }}>type=<select className="px-2 py-1 focus:outline-none ml-1"
                    style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO, fontSize: "11px" }}>
                    <option>d3-bars</option><option>column-chart</option><option>d3-lines</option>
                  </select></div>
                  <button className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold"
                    style={{ background: DIM, color: "#dcfce7" }}>
                    <BarChart2 className="w-3 h-3" />[PUSH_TO_DATAWRAPPER]
                  </button>
                </div>
              )}
            </div>

            {/* Raw JSON */}
            <div style={{ borderTop: `1px solid ${BORDER}` }}>
              <button onClick={() => setShowRaw(s => !s)}
                className="w-full px-6 py-2.5 flex items-center gap-2 text-xs"
                style={{ background: PANEL, color: GREEN }}>
                {showRaw ? "[-]" : "[+]"} RAW_JSON
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
      </main>
    </div>
  );
}
