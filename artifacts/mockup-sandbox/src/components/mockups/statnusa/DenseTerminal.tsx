import { useState } from "react";
import { Search, Loader2, BarChart2, ChevronDown, ChevronUp, Terminal } from "lucide-react";

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

const MOCK_ROWS = [
  ["Papua","7.08"],["Jawa Barat","6.66"],["Banten","6.63"],["Papua Barat Daya","6.56"],
  ["Kep. Riau","6.35"],["DKI Jakarta","6.31"],["Maluku","6.11"],["Sulawesi Utara","5.78"],
  ["Aceh","5.60"],["Sumatera Barat","5.52"],["Sumatera Utara","5.28"],["Kalimantan Timur","5.20"],
];

const EXAMPLE_URLS = ["Pengangguran", "Umur Harapan Hidup", "Persentase Penduduk Miskin"];
const MONO = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";

function PreviewChart() {
  const nationalPct = (NATIONAL_RATE / MAX_BAR) * 100;
  return (
    <div className="space-y-1.5">
      {PREVIEW_BARS.map(({ label, value }) => {
        const pct = (value / MAX_BAR) * 100;
        const filled = Math.round(pct / 100 * 28);
        const bar = "█".repeat(filled) + "░".repeat(28 - filled);
        return (
          <div key={label} className="flex items-center gap-2 text-xs" style={{ fontFamily: MONO }}>
            <span className="w-20 text-right flex-shrink-0 truncate" style={{ color: "#6ee7b7" }}>{label.slice(0,12)}</span>
            <span style={{ color: "#22c55e" }}>{bar}</span>
            <span style={{ color: "#86efac" }}>{value.toFixed(2)}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-2 text-xs mt-2 pt-2" style={{ borderTop: "1px solid #1a2e1a", fontFamily: MONO }}>
        <span className="w-20 flex-shrink-0" />
        <span style={{ color: "#166534" }}>{"┌─────────────────────────────┐"}</span>
      </div>
      <div className="flex items-center gap-2 text-xs" style={{ fontFamily: MONO }}>
        <span className="w-20 flex-shrink-0" />
        <span style={{ color: "#15803d" }}>0%{" ".repeat(8)}4%{" ".repeat(7)}8%</span>
      </div>
      <div className="text-xs mt-1" style={{ fontFamily: MONO, color: "#4ade80" }}>
        &gt; NASIONAL={NATIONAL_RATE}% · N=38 · src=Sakernas · th=2025q4
      </div>
    </div>
  );
}

export function DenseTerminal() {
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [input, setInput] = useState("https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/2562/th/125/key/WebAPI_KEY");

  function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setHasData(true); }, 1200);
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0f0a", fontFamily: MONO, color: "#22c55e" }}>

      {/* Header */}
      <header style={{ background: "#0d130d", borderBottom: "1px solid #14532d" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4" style={{ color: "#4ade80" }} />
            <span className="text-sm font-bold" style={{ color: "#4ade80" }}>StatNusa</span>
            <span className="text-xs px-2 py-0.5" style={{ color: "#166534", border: "1px solid #166534" }}>v2.0.0</span>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#166534" }}>
            <span>PORT:8080</span>
            <span style={{ color: "#22c55e" }}>● READY</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">

        {!hasData && (
          <div className="p-4" style={{ background: "#0d130d", border: "1px solid #14532d" }}>
            <div className="text-xs mb-3" style={{ color: "#166534" }}>
              <span style={{ color: "#4ade80" }}>$</span> statnusa --preview --dataset=TPT --period=2025q4
            </div>
            <div className="mb-1 text-xs" style={{ color: "#4ade80" }}>
              TPT_MENURUT_PROVINSI · 2025-Q4 · N=38 · unit=Persen
            </div>
            <div className="text-xs mb-3" style={{ color: "#166534" }}>
              {"─".repeat(60)}
            </div>
            <PreviewChart />
            <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid #14532d", color: "#166534" }}>
              [OK] 38 obs loaded · last_update=2026-02-06 · key=Sakernas
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="p-4" style={{ background: "#0d130d", border: "1px solid #14532d" }}>
          <div className="text-xs mb-3" style={{ color: "#166534" }}>
            <span style={{ color: "#4ade80" }}>$</span> statnusa fetch --url=
          </div>
          <form onSubmit={handleFetch} className="space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs resize-none focus:outline-none"
              style={{ background: "#060c06", border: "1px solid #166534", color: "#86efac", fontFamily: MONO }}
            />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold transition-colors disabled:opacity-50"
                style={{ background: "#166534", color: "#dcfce7", border: "none" }}>
                {loading ? <><Loader2 className="w-3 h-3 animate-spin" />[FETCHING]</> : <><Search className="w-3 h-3" />[EXECUTE]</>}
              </button>
              {hasData && <button onClick={() => setHasData(false)} className="text-xs" style={{ color: "#166534", textDecoration: "underline" }}>[RESET]</button>}
            </div>
          </form>
          <div className="flex items-center gap-2 flex-wrap mt-2 text-xs" style={{ color: "#166534" }}>
            <span>presets:</span>
            {EXAMPLE_URLS.map((ex) => (
              <button key={ex} className="px-2 py-0.5" style={{ border: "1px solid #166534", color: "#4ade80" }}>{ex}</button>
            ))}
          </div>
        </div>

        {hasData && (
          <div className="space-y-4">
            <div className="text-xs" style={{ color: "#166534" }}>
              <div><span style={{ color: "#4ade80" }}>[OK]</span> dataset loaded · var=2562 · th=125 · turtahun=328</div>
              <div style={{ color: "#22c55e" }}>title: Tingkat Pengangguran Terbuka menurut Provinsi (Triwulanan)</div>
              <div>rows=38 · cols=2 · period=November 2025 · unit=Persen</div>
            </div>

            <div className="overflow-hidden" style={{ background: "#0d130d", border: "1px solid #14532d" }}>
              <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid #14532d" }}>
                <span className="text-xs" style={{ color: "#4ade80" }}>DATA TABLE</span>
                <button className="text-xs px-3 py-1" style={{ background: "#166534", color: "#dcfce7" }}>CSV</button>
              </div>
              <div className="p-4">
                <div className="text-xs mb-2" style={{ color: "#166534" }}>
                  {"idx  PROVINSI             TPT(%)"}
                </div>
                <div className="text-xs" style={{ color: "#166534" }}>
                  {"─".repeat(40)}
                </div>
                {MOCK_ROWS.map(([prov, val], i) => (
                  <div key={i} className="text-xs py-0.5 flex gap-3" style={{ fontFamily: MONO }}>
                    <span style={{ color: "#166534" }}>{String(i).padStart(3, "0")}</span>
                    <span className="w-28 truncate" style={{ color: "#86efac" }}>{prov}</span>
                    <span style={{ color: "#4ade80" }}>{val}</span>
                  </div>
                ))}
                <div className="text-xs mt-2 pt-2" style={{ borderTop: "1px solid #14532d", color: "#166534" }}>
                  12 / 38 rows shown · sorted desc
                </div>
              </div>
            </div>

            <div className="p-4" style={{ background: "#0d130d", border: "1px solid #14532d" }}>
              <div className="text-xs mb-3" style={{ color: "#4ade80" }}>
                <BarChart2 className="w-3 h-3 inline mr-1" />DATAWRAPPER EXPORT
              </div>
              <div className="space-y-3">
                <div className="text-xs" style={{ color: "#166534" }}>
                  title=<input type="text" defaultValue="Tingkat Pengangguran Terbuka menurut Provinsi, November 2025"
                    className="px-2 py-1 focus:outline-none w-80" style={{ background: "#060c06", color: "#86efac", border: "1px solid #166534", fontFamily: MONO, fontSize: "11px" }} />
                </div>
                <div className="text-xs" style={{ color: "#166534" }}>
                  type=<select className="px-2 py-1 focus:outline-none" style={{ background: "#060c06", color: "#86efac", border: "1px solid #166534", fontFamily: MONO, fontSize: "11px" }}>
                    <option>d3-bars</option><option>d3-lines</option><option>d3-pies</option>
                  </select>
                  <span className="ml-4">rows=38 · cols=2</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold"
                  style={{ background: "#166534", color: "#dcfce7" }}>
                  <BarChart2 className="w-3 h-3" />[PUSH_TO_DATAWRAPPER]
                </button>
              </div>
            </div>

            <div style={{ border: "1px solid #14532d", overflow: "hidden" }}>
              <button onClick={() => setShowRaw(s => !s)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs"
                style={{ background: "#0d130d", color: "#22c55e" }}>
                <span>[RAW_JSON]</span>
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showRaw && <pre className="text-xs p-4 overflow-auto max-h-40" style={{ background: "#060c06", color: "#4ade80", fontFamily: MONO }}>
                {`{\n  "status": "OK",\n  "var": [{"label": "TPT menurut Provinsi"}],\n  "datacontent": {"320025620125328": 6.66}\n}`}
              </pre>}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-4" style={{ borderTop: "1px solid #14532d" }}>
        <p className="text-xs" style={{ color: "#166534" }}>
          src: <a href="https://webapi.bps.go.id" className="underline" style={{ color: "#22c55e" }}>webapi.bps.go.id</a>
          {" · "} viz: <a href="https://www.datawrapper.de" className="underline" style={{ color: "#22c55e" }}>datawrapper.de</a>
          {" · "} StatNusa © 2025
        </p>
      </footer>
    </div>
  );
}
