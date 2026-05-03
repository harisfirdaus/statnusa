import { useState } from "react";
import { Search, Loader2, BarChart2, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from "lucide-react";

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

function PreviewChart() {
  const nationalPct = (NATIONAL_RATE / MAX_BAR) * 100;
  return (
    <div className="space-y-2.5">
      {PREVIEW_BARS.map(({ label, value }) => {
        const pct = (value / MAX_BAR) * 100;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-amber-900/60 w-36 text-right flex-shrink-0 truncate" style={{ fontFamily: "'Georgia', serif" }}>{label}</span>
            <div className="flex-1 h-5 bg-amber-50 relative overflow-hidden rounded-sm">
              <div className="absolute inset-y-0 left-0 transition-all rounded-sm" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #92400e, #d97706)" }} />
              <div className="absolute inset-y-0 w-px bg-amber-400 opacity-70" style={{ left: `${nationalPct}%` }} />
            </div>
            <span className="text-xs font-mono text-amber-800 w-8 flex-shrink-0">{value}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-1">
        <span className="w-36 flex-shrink-0" />
        <div className="flex-1 flex justify-between">
          {[0, 2, 4, 6, 8].map((n) => <span key={n} className="text-[10px] text-amber-300 tabular-nums">{n}%</span>)}
        </div>
        <span className="w-8 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-36 flex-shrink-0" />
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-amber-700/60">
            <span className="w-3 h-2.5 inline-block flex-shrink-0 rounded-sm" style={{ background: "linear-gradient(90deg, #92400e, #d97706)" }} />8 provinsi tertinggi
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-amber-700/60">
            <span className="w-px h-3 bg-amber-400 inline-block flex-shrink-0" />Nasional ({NATIONAL_RATE}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export function WarmEditorial() {
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  function handleFetch() { setLoading(true); setTimeout(() => { setLoading(false); setHasData(true); }, 1200); }

  return (
    <div className="min-h-screen" style={{ background: "#faf8f4", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ background: "#faf8f4", borderBottom: "1px solid #e8ddc8" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center" style={{ background: "#92400e" }}>
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight" style={{ color: "#1c0a00", fontFamily: "'Georgia', serif" }}>StatNusa</h1>
              <p className="text-xs" style={{ color: "#92400e", opacity: 0.7 }}>Ekstrak &amp; Visualisasi Data BPS</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>Data Aktual</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {!hasData && (
          <div className="overflow-hidden" style={{ background: "#fffbf5", border: "1px solid #e8ddc8", borderRadius: "2px" }}>
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid #f0e6d0" }}>
              <div className="flex items-start justify-between gap-6 mb-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#d97706" }}>Contoh Output · November 2025</div>
                  <h2 className="text-2xl font-bold leading-tight" style={{ color: "#1c0a00", fontFamily: "'Georgia', serif" }}>
                    Tingkat Pengangguran Terbuka<br />Menurut Provinsi
                  </h2>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: "#78350f", opacity: 0.8 }}>
                    Tempelkan URL data BPS di bawah untuk menghasilkan tabel &amp; visualisasi serupa.
                  </p>
                </div>
                <div className="flex-shrink-0 text-right space-y-1.5 pt-1">
                  {[["38 Provinsi","Cakupan"],["4.74%","Rata-rata Nas."],["Sakernas","Sumber"]].map(([v, l]) => (
                    <div key={l}>
                      <div className="text-base font-bold" style={{ color: "#92400e", fontFamily: "'Georgia', serif" }}>{v}</div>
                      <div className="text-[10px] uppercase tracking-widest" style={{ color: "#d97706" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <PreviewChart />
            </div>
            <div className="px-6 py-2.5 text-xs" style={{ background: "#fef9f0", color: "#b45309" }}>
              Data riil dari BPS API · Sakernas, BPS · November 2025
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="p-5 space-y-4" style={{ background: "#fffbf5", border: "1px solid #e8ddc8", borderRadius: "2px" }}>
          <h2 className="font-semibold" style={{ color: "#1c0a00", fontFamily: "'Georgia', serif" }}>Masukkan URL Data JSON BPS</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleFetch(); }} className="space-y-3">
            <textarea
              rows={2}
              readOnly
              defaultValue="https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/2562/th/125/key/WebAPI_KEY"
              className="w-full px-3 py-2.5 text-xs font-mono resize-none focus:outline-none"
              style={{ border: "1px solid #e8ddc8", borderRadius: "2px", background: "#faf8f4", color: "#451a03" }}
            />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: "#92400e", borderRadius: "2px" }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Mengambil…</> : <><Search className="w-4 h-4" />Ambil Data</>}
              </button>
              {hasData && <button onClick={() => setHasData(false)} className="text-xs underline" style={{ color: "#b45309" }}>Reset</button>}
            </div>
          </form>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: "#b45309", opacity: 0.7 }}>Contoh:</span>
            {EXAMPLE_URLS.map((ex) => (
              <button key={ex} className="text-xs px-3 py-1 transition-colors"
                style={{ border: "1px solid #e8ddc8", borderRadius: "2px", color: "#92400e", background: "transparent" }}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {hasData && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#1c0a00", fontFamily: "'Georgia', serif" }}>
                Tingkat Pengangguran Terbuka menurut Provinsi (Triwulanan)
              </h2>
              <p className="text-xs mt-1" style={{ color: "#b45309" }}>November 2025 · Survei Angkatan Kerja Nasional (Sakernas), BPS</p>
            </div>

            <div className="p-5" style={{ background: "#fffbf5", border: "1px solid #e8ddc8", borderRadius: "2px" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#b45309" }}>Tabel Data</span>
                <button className="text-xs px-3 py-1 text-white" style={{ background: "#92400e", borderRadius: "2px" }}>Unduh CSV</button>
              </div>
              <table className="w-full text-sm">
                <thead><tr>
                  {["Provinsi","TPT (%)"].map(c => <th key={c} className="text-left text-xs font-semibold uppercase tracking-widest pb-2 border-b pr-8 last:pr-0" style={{ color: "#b45309", borderColor: "#e8ddc8" }}>{c}</th>)}
                </tr></thead>
                <tbody>
                  {MOCK_ROWS.map(([prov, val], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f5ede0" }}>
                      <td className="py-2 pr-8 text-sm" style={{ color: "#451a03" }}>{prov}</td>
                      <td className="py-2 font-mono text-sm" style={{ color: "#92400e" }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5" style={{ background: "#fffbf5", border: "1px solid #e8ddc8", borderRadius: "2px" }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4" style={{ color: "#d97706" }} />
                <h3 className="font-semibold" style={{ color: "#1c0a00", fontFamily: "'Georgia', serif" }}>Buat Visualisasi di Datawrapper</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#92400e" }}>Judul Chart</label>
                  <input type="text" defaultValue="Tingkat Pengangguran Terbuka menurut Provinsi, November 2025"
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid #e8ddc8", borderRadius: "2px", background: "#faf8f4", color: "#451a03" }} />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
                  style={{ background: "#92400e", borderRadius: "2px" }}>
                  <BarChart2 className="w-4 h-4" />Buat Visualisasi
                </button>
              </div>
            </div>

            <div style={{ border: "1px solid #e8ddc8", borderRadius: "2px", overflow: "hidden" }}>
              <button onClick={() => setShowRaw(s => !s)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium"
                style={{ background: "#faf8f4", color: "#92400e" }}>
                <span>Lihat Data Mentah (JSON)</span>
                {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showRaw && <pre className="text-xs p-4 overflow-auto max-h-48 font-mono" style={{ background: "#1c0a00", color: "#d97706" }}>{`{"status":"OK","datacontent":{"320025620125328":6.66,...}}`}</pre>}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-6" style={{ borderTop: "1px solid #e8ddc8" }}>
        <p className="text-xs" style={{ color: "#b45309", opacity: 0.6 }}>
          Data: <a href="https://webapi.bps.go.id" className="underline">BPS Web API</a> · Visualisasi: <a href="https://www.datawrapper.de" className="underline">Datawrapper</a>
        </p>
      </footer>
    </div>
  );
}
