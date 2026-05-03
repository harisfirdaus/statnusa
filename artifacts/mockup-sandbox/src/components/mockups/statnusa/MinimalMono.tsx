import { useState } from "react";
import {
  Search, Database, BarChart2, ChevronDown, ChevronUp,
  ExternalLink, CheckCircle, Loader2, ArrowRight,
} from "lucide-react";

// ─── Real data: TPT per Provinsi, November 2025 (Sakernas Triwulanan) ─────────

const PREVIEW_BARS = [
  { label: "Papua",          value: 7.08 },
  { label: "Jawa Barat",     value: 6.66 },
  { label: "Banten",         value: 6.63 },
  { label: "Papua Barat Daya", value: 6.56 },
  { label: "Kep. Riau",     value: 6.35 },
  { label: "DKI Jakarta",   value: 6.31 },
  { label: "Maluku",        value: 6.11 },
  { label: "Sulawesi Utara", value: 5.78 },
];
const NATIONAL_RATE = 4.74;
const MAX_BAR = 8;

const MOCK_ROWS = [
  ["Papua","7.08"],["Jawa Barat","6.66"],["Banten","6.63"],
  ["Papua Barat Daya","6.56"],["Kep. Riau","6.35"],["DKI Jakarta","6.31"],
  ["Maluku","6.11"],["Sulawesi Utara","5.78"],["Aceh","5.60"],
  ["Sumatera Barat","5.52"],["Sumatera Utara","5.28"],["Kalimantan Timur","5.20"],
  ["Kalimantan Barat","4.63"],["Sulawesi Selatan","4.45"],["Maluku Utara","4.44"],
  ["Papua Barat","4.34"],["Jawa Tengah","4.32"],["Kep. Bangka Belitung","4.30"],
  ["Lampung","4.14"],["Kalimantan Selatan","4.10"],["Jambi","4.08"],
  ["Riau","4.06"],["Papua Selatan","3.89"],["Kalimantan Utara","3.83"],
  ["Papua Tengah","3.74"],["Jawa Timur","3.71"],["Sumatera Selatan","3.59"],
  ["Kalimantan Tengah","3.44"],["Bengkulu","3.37"],["Sulawesi Tenggara","3.33"],
  ["DI Yogyakarta","3.30"],["Gorontalo","3.23"],["Nusa Tenggara Timur","3.10"],
  ["Nusa Tenggara Barat","3.05"],["Sulawesi Barat","3.01"],
  ["Sulawesi Tengah","2.89"],["Papua Pegunungan","1.55"],["Bali","1.45"],
];

const EXAMPLE_URLS = ["Pengangguran", "Umur Harapan Hidup", "Persentase Penduduk Miskin"];

const CHART_GROUPS = [
  { group: "Bar (Horizontal)", items: ["Bar Chart (1 seri)","Grouped Bars","Stacked Bars"] },
  { group: "Garis & Area",     items: ["Multiple Lines","Area Chart"] },
  { group: "Lainnya",          items: ["Pie Chart","Tabel Interaktif"] },
];

const PALETTES = [
  { name: "Default",  colors: [] as string[] },
  { name: "Biru BPS", colors: ["#1a4f8a","#2e6eb5","#4a8ecf","#6fb0e8"] },
  { name: "Monokrom", colors: ["#1a1a1a","#404040","#666666","#999999"] },
  { name: "Hangat",   colors: ["#922b21","#d35400","#e67e22","#f1c40f"] },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-xs font-semibold uppercase tracking-widest text-neutral-400 pb-2 border-b border-neutral-200 pr-8 last:pr-0">
      {children}
    </th>
  );
}

function Cell({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`py-2 pr-8 last:pr-0 text-sm border-b border-neutral-100 text-neutral-700 ${mono ? "font-mono" : ""}`}>
      {children}
    </td>
  );
}

function Section({ label, badge, open, onToggle, children }: {
  label: string; badge?: string; open: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-neutral-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 transition-colors"
      >
        <span>
          {label}
          {badge && <span className="ml-2 font-normal normal-case tracking-normal text-neutral-400">{badge}</span>}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="border-t border-neutral-200 p-4 bg-neutral-50">{children}</div>}
    </div>
  );
}

function PreviewChart() {
  const nationalPct = (NATIONAL_RATE / MAX_BAR) * 100;
  return (
    <div className="space-y-2">
      {PREVIEW_BARS.map(({ label, value }) => {
        const pct = (value / MAX_BAR) * 100;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 w-36 text-right flex-shrink-0 truncate">{label}</span>
            <div className="flex-1 h-5 bg-neutral-100 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-neutral-800"
                style={{ width: `${pct}%` }}
              />
              {/* national rate marker */}
              <div
                className="absolute inset-y-0 w-px bg-neutral-400 opacity-60"
                style={{ left: `${nationalPct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-neutral-500 w-8 flex-shrink-0">{value}</span>
          </div>
        );
      })}
      {/* Axis */}
      <div className="flex items-center gap-3 pt-1">
        <span className="w-36 flex-shrink-0" />
        <div className="flex-1 flex justify-between">
          {[0, 2, 4, 6, 8].map((n) => (
            <span key={n} className="text-[10px] text-neutral-300 tabular-nums">{n}%</span>
          ))}
        </div>
        <span className="w-8 flex-shrink-0" />
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 pt-0.5">
        <span className="w-36 flex-shrink-0" />
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
            <span className="w-3 h-3 bg-neutral-800 inline-block flex-shrink-0" />
            8 provinsi tertinggi
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
            <span className="w-px h-3 bg-neutral-400 inline-block flex-shrink-0" />
            Rata-rata nasional ({NATIONAL_RATE}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MinimalMono() {
  const [hasData, setHasData]           = useState(false);
  const [loading, setLoading]           = useState(false);
  const [paletteIdx, setPaletteIdx]     = useState(0);
  const [showRaw, setShowRaw]           = useState(false);
  const [chartCreated, setChartCreated] = useState(false);
  const [colorOpen, setColorOpen]       = useState(false);
  const [colsOpen, setColsOpen]         = useState(false);
  const [rowsOpen, setRowsOpen]         = useState(false);

  function handleFetch() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setHasData(true); }, 1200);
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-neutral-900 text-white flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 leading-tight tracking-tight">StatNusa</h1>
            <p className="text-xs text-neutral-400">Ekstrak &amp; Visualisasi Data Badan Pusat Statistik</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Hero preview — hanya sebelum data dimuat ── */}
        {!hasData && (
          <div className="border border-neutral-200 overflow-hidden">
            {/* Top strip */}
            <div className="px-6 pt-5 pb-4 border-b border-neutral-100 flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-sm">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-300">Contoh Output</p>
                <h2 className="text-base font-bold text-neutral-900 leading-snug">
                  Tingkat Pengangguran Terbuka<br />Menurut Provinsi
                </h2>
                <p className="text-xs text-neutral-400">
                  Tempelkan URL data BPS di bawah untuk menghasilkan tabel &amp; visualisasi serupa dalam hitungan detik.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {[
                  { label: "Periode",    value: "November 2025" },
                  { label: "Cakupan",    value: "38 Provinsi" },
                  { label: "Nasional",   value: `${NATIONAL_RATE}%` },
                  { label: "Sumber",     value: "Sakernas, BPS" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-300 font-semibold">{label}</span>
                    <span className="text-xs font-mono text-neutral-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="px-6 py-5">
              <PreviewChart />
            </div>

            {/* Bottom CTA */}
            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
              <p className="text-xs text-neutral-400">
                Data riil dari BPS API &mdash; otomatis diekstrak, bisa diedit &amp; dikirim ke Datawrapper
              </p>
              <span className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
                Coba sekarang <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}

        {/* ── URL Input ── */}
        <div className="border border-neutral-200 p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Masukkan URL Data JSON BPS
          </h2>
          <div className="space-y-3">
            <textarea
              defaultValue="https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/2562/th/125/key/WebAPI_KEY"
              rows={2}
              readOnly
              className="w-full px-3 py-2.5 text-xs border border-neutral-300 focus:outline-none focus:border-neutral-900 resize-none font-mono text-neutral-700 bg-white transition-colors"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleFetch}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-700 transition-colors tracking-wide disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Mengambil data…</>
                  : <><Search className="w-3.5 h-3.5" />AMBIL DATA</>}
              </button>
              {hasData && (
                <button
                  onClick={() => { setHasData(false); setChartCreated(false); }}
                  className="text-xs text-neutral-400 hover:text-neutral-700 underline underline-offset-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-400 mr-1">Contoh:</span>
            {EXAMPLE_URLS.map((ex) => (
              <button key={ex}
                className="text-xs px-3 py-1 border border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results ── */}
        {hasData && (
          <div className="space-y-5">

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-neutral-900 leading-tight">
                Tingkat Pengangguran Terbuka menurut Provinsi (Triwulanan)
              </h2>
              <p className="text-xs text-neutral-400">November 2025 · Survei Angkatan Kerja Nasional (Sakernas), BPS</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[{ l:"PERIODE", v:"November 2025" },{ l:"KOLOM", v:"2" },{ l:"BARIS", v:"38" }]
                .map(({ l, v }) => (
                  <span key={l} className="flex items-center gap-1.5 text-xs border border-neutral-200 px-3 py-1">
                    <span className="text-neutral-400 uppercase tracking-widest font-semibold">{l}</span>
                    <span className="text-neutral-700 font-mono">{v}</span>
                  </span>
                ))}
            </div>

            <div className="border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Tabel Data</span>
                <button className="text-xs text-neutral-500 border border-neutral-200 px-3 py-1 hover:border-neutral-900 hover:text-neutral-900 transition-colors">
                  Unduh CSV
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr><ColHeader>Provinsi</ColHeader><ColHeader>TPT (%)</ColHeader></tr>
                </thead>
                <tbody>
                  {MOCK_ROWS.map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50 transition-colors">
                      <Cell>{row[0]}</Cell>
                      <Cell mono>{row[1]}</Cell>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-neutral-400 mt-3">38 provinsi · diurutkan dari nilai tertinggi</p>
            </div>

            <div className="border border-neutral-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Buat Visualisasi di Datawrapper
                </h3>
              </div>

              {chartCreated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs border border-neutral-300 px-4 py-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 text-neutral-700" />
                    <span className="text-neutral-700">Chart berhasil dibuat dan dipublikasikan.</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-700 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Edit di Datawrapper
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-xs border border-neutral-300 text-neutral-700 hover:border-neutral-900 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Lihat Chart Publik
                    </button>
                  </div>
                  <button onClick={() => setChartCreated(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 underline">
                    Buat chart baru
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1.5">Judul Chart</label>
                    <input type="text"
                      defaultValue="Tingkat Pengangguran Terbuka menurut Provinsi, November 2025"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white text-neutral-700 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1.5">
                      Deskripsi <span className="font-normal normal-case">(opsional)</span>
                    </label>
                    <textarea rows={2} placeholder="Teks pendek di bawah judul chart"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white resize-none text-neutral-700 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1.5">Tipe Chart</label>
                    <select className="w-full px-3 py-2 text-sm border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white text-neutral-700">
                      {CHART_GROUPS.map((g) => (
                        <optgroup key={g.group} label={g.group}>
                          {g.items.map((it) => <option key={it}>{it}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <Section label="Warna Chart" badge={`— ${PALETTES[paletteIdx].name}`} open={colorOpen} onToggle={() => setColorOpen((s) => !s)}>
                    <div className="grid grid-cols-4 gap-2">
                      {PALETTES.map((p, i) => (
                        <button key={i} onClick={() => setPaletteIdx(i)}
                          className={`flex flex-col gap-1.5 p-2 border text-left transition-all ${paletteIdx === i ? "border-neutral-900 bg-white" : "border-neutral-200 hover:border-neutral-400"}`}>
                          <span className="text-xs font-medium text-neutral-700 truncate">{p.name}</span>
                          <span className="flex gap-1">
                            {p.colors.length === 0
                              ? <span className="text-xs text-neutral-400 italic">default</span>
                              : p.colors.map((c) => <span key={c} className="w-4 h-4 border border-neutral-200 inline-block" style={{ background: c }} />)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section label="Kolom" badge="(1 dari 1 dipilih)" open={colsOpen} onToggle={() => setColsOpen((s) => !s)}>
                    <div className="space-y-1">
                      {["Provinsi", "TPT (%)"].map((col, i) => (
                        <label key={i} className={`flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-white transition-colors ${i === 0 ? "opacity-50" : ""}`}>
                          <input type="checkbox" defaultChecked className="accent-neutral-900" disabled={i === 0} />
                          <span className="text-neutral-700">
                            {col}{i === 0 && <span className="text-xs text-neutral-400 ml-1">(label)</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </Section>

                  <Section label="Baris" badge={`(${MOCK_ROWS.length} dari ${MOCK_ROWS.length} dipilih)`} open={rowsOpen} onToggle={() => setRowsOpen((s) => !s)}>
                    <input type="search" placeholder="Cari baris…"
                      className="w-full px-3 py-1.5 text-xs border border-neutral-300 focus:outline-none focus:border-neutral-900 mb-2" />
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                      {MOCK_ROWS.map((row, i) => (
                        <label key={i} className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-white">
                          <input type="checkbox" defaultChecked className="accent-neutral-900" />
                          <span className="truncate text-neutral-700">{row[0]}</span>
                        </label>
                      ))}
                    </div>
                  </Section>

                  <p className="text-xs text-neutral-400">{MOCK_ROWS.length} baris × 2 kolom akan dikirim ke Datawrapper.</p>

                  <button onClick={() => setChartCreated(true)}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-700 transition-colors tracking-wide">
                    <BarChart2 className="w-3.5 h-3.5" />
                    BUAT VISUALISASI
                  </button>
                </div>
              )}
            </div>

            <div className="border border-neutral-200 overflow-hidden">
              <button onClick={() => setShowRaw((s) => !s)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 transition-colors">
                <span>Lihat Data Mentah (JSON)</span>
                {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showRaw && (
                <pre className="bg-neutral-950 text-neutral-300 text-xs p-4 overflow-auto max-h-64 font-mono border-t border-neutral-200">
                  {`{\n  "status": "OK",\n  "var": [{"val": 2562, "label": "Tingkat Pengangguran Terbuka menurut Provinsi (Triwulanan)"}],\n  "datacontent": {\n    "320025620125328": 6.66,\n    "360025620125328": 6.63,\n    ...\n  }\n}`}
                </pre>
              )}
            </div>

          </div>
        )}

      </main>

      <footer className="max-w-5xl mx-auto px-6 py-6 border-t border-neutral-100">
        <p className="text-xs text-neutral-400">
          Data bersumber dari{" "}
          <a href="https://webapi.bps.go.id" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-700 underline underline-offset-2">BPS Web API</a>
          . Visualisasi via{" "}
          <a href="https://www.datawrapper.de" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-700 underline underline-offset-2">Datawrapper</a>
          .
        </p>
      </footer>

    </div>
  );
}
