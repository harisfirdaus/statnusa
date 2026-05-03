import { useState } from "react";
import { Search, Loader2, BarChart2, ChevronDown, ChevronUp, ExternalLink, CheckCircle, Shield } from "lucide-react";

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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
      style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>
      {children}
    </span>
  );
}

function PreviewChart() {
  const nationalPct = (NATIONAL_RATE / MAX_BAR) * 100;
  return (
    <div className="space-y-2.5">
      {PREVIEW_BARS.map(({ label, value }) => {
        const pct = (value / MAX_BAR) * 100;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs w-36 text-right flex-shrink-0 truncate" style={{ color: "#475569" }}>{label}</span>
            <div className="flex-1 h-4 rounded-full relative overflow-hidden" style={{ background: "#e0f2fe" }}>
              <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg, #0284c7, #38bdf8)" }} />
              <div className="absolute inset-y-0 w-0.5 rounded-full opacity-60"
                style={{ left: `${nationalPct}%`, background: "#0c4a6e" }} />
            </div>
            <span className="text-xs font-medium w-8 flex-shrink-0 tabular-nums" style={{ color: "#0369a1" }}>{value}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-1">
        <span className="w-36 flex-shrink-0" />
        <div className="flex-1 flex justify-between">
          {[0,2,4,6,8].map((n) => <span key={n} className="text-[10px] tabular-nums" style={{ color: "#bae6fd" }}>{n}%</span>)}
        </div>
        <span className="w-8 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-36 flex-shrink-0" />
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "#64748b" }}>
            <span className="w-3 h-2 inline-block flex-shrink-0 rounded-full" style={{ background: "linear-gradient(90deg, #0284c7, #38bdf8)" }} />
            8 provinsi tertinggi
          </span>
          <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "#64748b" }}>
            <span className="w-0.5 h-3 inline-block flex-shrink-0 rounded-full" style={{ background: "#0c4a6e" }} />
            Nasional ({NATIONAL_RATE}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export function SoftOfficial() {
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [url, setUrl] = useState("");

  function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setHasData(true); }, 1200);
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0f9ff", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ background: "white", borderBottom: "2px solid #0284c7", boxShadow: "0 1px 4px rgba(2,132,199,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0284c7, #38bdf8)" }}>
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: "#0c4a6e" }}>StatNusa</h1>
              <p className="text-xs" style={{ color: "#64748b" }}>Ekstrak &amp; Visualisasi Data Badan Pusat Statistik</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" style={{ color: "#0284c7" }} />
            <span className="text-xs font-medium" style={{ color: "#0369a1" }}>Data Resmi BPS</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {!hasData && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #e0f2fe", boxShadow: "0 4px 20px rgba(2,132,199,0.08)" }}>
            <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid #f0f9ff" }}>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                    style={{ background: "#e0f2fe", color: "#0369a1" }}>Contoh Output</span>
                  <h2 className="text-lg font-bold leading-snug mb-2" style={{ color: "#0c4a6e" }}>
                    Tingkat Pengangguran Terbuka<br />Menurut Provinsi
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
                    Tempelkan URL data BPS di bawah untuk menghasilkan tabel &amp; visualisasi serupa dalam hitungan detik.
                  </p>
                </div>
                <div className="flex-shrink-0 space-y-1.5 text-right pt-1">
                  {[["November 2025","Periode"],["38 Provinsi","Cakupan"],["4.74%","Rata-rata Nas."]].map(([v,l]) => (
                    <div key={l}>
                      <div className="text-sm font-bold" style={{ color: "#0284c7" }}>{v}</div>
                      <div className="text-[10px] uppercase tracking-widest" style={{ color: "#94a3b8" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <PreviewChart />
            </div>
            <div className="px-6 py-3 flex items-center gap-2" style={{ background: "#f0f9ff", borderTop: "1px solid #e0f2fe" }}>
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#0284c7" }} />
              <span className="text-xs" style={{ color: "#0369a1" }}>Data bersumber langsung dari BPS Web API · Sakernas, November 2025</span>
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid #e0f2fe", boxShadow: "0 2px 8px rgba(2,132,199,0.06)" }}>
          <div>
            <h2 className="font-semibold mb-0.5" style={{ color: "#0c4a6e" }}>Masukkan URL Data JSON BPS</h2>
            <p className="text-xs" style={{ color: "#94a3b8" }}>Salin URL dari portal BPS Web API</p>
          </div>
          <form onSubmit={handleFetch} className="space-y-3">
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://webapi.bps.go.id/v1/api/list/model/data/..."
              rows={3}
              className="w-full px-3 py-2 text-sm resize-none font-mono focus:outline-none transition-all"
              style={{ border: "1.5px solid #bae6fd", borderRadius: "10px", color: "#0c4a6e", background: "#f8fcff" }}
              disabled={loading}
            />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #0284c7, #38bdf8)", boxShadow: "0 2px 8px rgba(2,132,199,0.3)" }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Mengambil data…</> : <><Search className="w-4 h-4" />Ambil Data</>}
              </button>
              {hasData && <button onClick={() => setHasData(false)} className="text-xs underline" style={{ color: "#0284c7" }}>Reset</button>}
            </div>
          </form>
          <div>
            <p className="text-xs mb-2 font-medium" style={{ color: "#64748b" }}>Contoh dataset:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_URLS.map((ex) => (
                <button key={ex}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasData && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#0c4a6e" }}>
                Tingkat Pengangguran Terbuka menurut Provinsi (Triwulanan)
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Chip>November 2025</Chip>
                <Chip>38 Provinsi</Chip>
                <Chip>Sakernas, BPS</Chip>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e0f2fe", boxShadow: "0 2px 8px rgba(2,132,199,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: "#0c4a6e" }}>Tabel Data</h3>
                <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium text-white"
                  style={{ background: "linear-gradient(135deg, #0284c7, #38bdf8)" }}>
                  Unduh CSV
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    {["Provinsi","TPT (%)"].map(c => (
                      <th key={c} className="text-left text-xs font-semibold uppercase tracking-wide pb-2 pr-8 last:pr-0"
                        style={{ color: "#64748b", borderBottom: "2px solid #e0f2fe" }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ROWS.map(([prov, val], i) => (
                    <tr key={i} className="transition-colors" style={{ borderBottom: "1px solid #f0f9ff" }}>
                      <td className="py-2 pr-8 text-sm font-medium" style={{ color: "#0c4a6e" }}>{prov}</td>
                      <td className="py-2 font-mono text-sm" style={{ color: "#0284c7" }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs mt-3" style={{ color: "#94a3b8" }}>Menampilkan 12 dari 38 baris · diurutkan dari nilai tertinggi</p>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e0f2fe", boxShadow: "0 2px 8px rgba(2,132,199,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5" style={{ color: "#0284c7" }} />
                <h3 className="font-semibold" style={{ color: "#0c4a6e" }}>Buat Visualisasi di Datawrapper</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#475569" }}>Judul Chart</label>
                  <input type="text" defaultValue="Tingkat Pengangguran Terbuka menurut Provinsi, November 2025"
                    className="w-full px-3 py-2 text-sm focus:outline-none transition-all"
                    style={{ border: "1.5px solid #bae6fd", borderRadius: "10px", color: "#0c4a6e", background: "#f8fcff" }} />
                </div>
                <button className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl"
                  style={{ background: "linear-gradient(135deg, #0284c7, #38bdf8)", boxShadow: "0 2px 8px rgba(2,132,199,0.3)" }}>
                  <BarChart2 className="w-4 h-4" />Buat Visualisasi
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #e0f2fe" }}>
              <button onClick={() => setShowRaw(s => !s)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium"
                style={{ color: "#0369a1" }}>
                <span>Lihat Data Mentah (JSON)</span>
                {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showRaw && (
                <pre className="text-xs p-4 overflow-auto max-h-48 font-mono" style={{ background: "#0c4a6e", color: "#38bdf8" }}>
                  {`{\n  "status": "OK",\n  "datacontent": {\n    "320025620125328": 6.66\n  }\n}`}
                </pre>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-6" style={{ borderTop: "1px solid #e0f2fe" }}>
        <p className="text-xs text-center" style={{ color: "#94a3b8" }}>
          Data bersumber dari{" "}
          <a href="https://webapi.bps.go.id" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#0284c7" }}>BPS Web API</a>
          . Visualisasi via{" "}
          <a href="https://www.datawrapper.de" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#0284c7" }}>Datawrapper</a>
          .
        </p>
      </footer>
    </div>
  );
}
