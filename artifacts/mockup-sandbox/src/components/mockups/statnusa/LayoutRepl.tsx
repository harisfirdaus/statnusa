import { useState, useRef, useEffect } from "react";
import { BarChart2, Terminal, ChevronDown, ChevronUp } from "lucide-react";

const MONO   = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const BG     = "#0a0f0a";
const PANEL  = "#0d130d";
const INPUT  = "#060c06";
const GREEN  = "#22c55e";
const BRIGHT = "#4ade80";
const LIGHT  = "#86efac";
const DIM    = "#166534";
const BORDER = "#14532d";

const MOCK_ROWS = [
  ["Papua","7.08"],["Jawa Barat","6.66"],["Banten","6.63"],["Papua Barat Daya","6.56"],
  ["Kep. Riau","6.35"],["DKI Jakarta","6.31"],["Maluku","6.11"],["Sulawesi Utara","5.78"],
  ["Aceh","5.60"],["Sumatera Barat","5.52"],
];

const PREVIEW_BARS = [
  { label: "Papua",       value: 7.08 },
  { label: "Jawa Barat",  value: 6.66 },
  { label: "Banten",      value: 6.63 },
  { label: "Papua Barat", value: 6.56 },
  { label: "Kep. Riau",   value: 6.35 },
  { label: "DKI Jakarta", value: 6.31 },
];

type OutputBlock =
  | { type: "cmd"; text: string }
  | { type: "ok"; title: string }
  | { type: "table" }
  | { type: "dw" }
  | { type: "err"; msg: string };

const INITIAL_OUTPUT: OutputBlock[] = [
  { type: "cmd", text: "statnusa --preview --dataset=TPT --period=2025q4" },
  { type: "ok", title: "TPT_MENURUT_PROVINSI · 2025-Q4 · N=38 · unit=Persen" },
];

const HISTORY = [
  "https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/2562/th/125/key/WebAPI_KEY",
  "help",
  "presets",
];

export function LayoutRepl() {
  const [output, setOutput] = useState<OutputBlock[]>(INITIAL_OUTPUT);
  const [cmd, setCmd] = useState("");
  const [loading, setLoading] = useState(false);
  const [histIdx, setHistIdx] = useState(-1);
  const [showDW, setShowDW] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  function runCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setCmd("");
    setHistIdx(-1);
    setOutput((prev) => [...prev, { type: "cmd", text: trimmed }]);

    if (trimmed === "help") {
      setOutput((prev) => [...prev,
        { type: "ok", title: "commands: fetch <url>, presets, clear, help" },
      ]);
      return;
    }
    if (trimmed === "presets") {
      setOutput((prev) => [...prev,
        { type: "ok", title: "Pengangguran | Umur Harapan Hidup | Kemiskinan" },
      ]);
      return;
    }
    if (trimmed === "clear") {
      setOutput([]);
      return;
    }
    if (trimmed.startsWith("http") || trimmed.startsWith("fetch ")) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOutput((prev) => [
          ...prev,
          { type: "ok", title: "Tingkat Pengangguran Terbuka menurut Provinsi (Triwulanan)" },
          { type: "table" },
          { type: "dw" },
        ]);
      }, 1200);
      return;
    }
    setOutput((prev) => [...prev, { type: "err", msg: `command not found: ${trimmed}. type 'help' for usage.` }]);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { runCommand(cmd); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, HISTORY.length - 1);
      setHistIdx(next);
      setCmd(HISTORY[next] ?? "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setCmd(next === -1 ? "" : HISTORY[next] ?? "");
    }
  }

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: BG, fontFamily: MONO, color: GREEN }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* ── TITLE BAR ── */}
      <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <Terminal className="w-3 h-3" style={{ color: BRIGHT }} />
        <span className="text-xs font-bold" style={{ color: BRIGHT }}>StatNusa</span>
        <span className="text-[10px]" style={{ color: DIM }}>— REPL v2.0 · type 'help' for usage</span>
        <span className="ml-auto text-[10px]" style={{ color: GREEN }}>● READY</span>
      </div>

      {/* ── SCROLLABLE OUTPUT ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {output.map((block, i) => {
          if (block.type === "cmd") return (
            <div key={i} className="text-xs" style={{ color: DIM }}>
              <span style={{ color: BRIGHT }}>❯</span> <span style={{ color: LIGHT }}>{block.text}</span>
            </div>
          );

          if (block.type === "ok") return (
            <div key={i} className="text-xs space-y-1.5 pl-4 border-l-2" style={{ borderColor: DIM }}>
              <div style={{ color: GREEN }}>{block.title}</div>
              {block.title.includes("TPT_MENURUT") && (
                <div className="space-y-1">
                  {PREVIEW_BARS.map(({ label, value }) => {
                    const bars = Math.round((value / 8) * 24);
                    return (
                      <div key={label} className="flex items-center gap-2 text-[11px]">
                        <span className="w-20 text-right" style={{ color: "#6ee7b7" }}>{label}</span>
                        <span style={{ color: GREEN }}>{"█".repeat(bars) + "░".repeat(24 - bars)}</span>
                        <span style={{ color: LIGHT }}>{value}</span>
                      </div>
                    );
                  })}
                  <div className="text-[11px]" style={{ color: BRIGHT }}>
                    &gt; NASIONAL=4.74% · N=38 · [OK]
                  </div>
                </div>
              )}
            </div>
          );

          if (block.type === "table") return (
            <div key={i} className="pl-4 border-l-2 space-y-1" style={{ borderColor: DIM }}>
              <div className="text-[11px] flex items-center justify-between">
                <span style={{ color: BRIGHT }}>DATA TABLE — rows=38 · cols=2</span>
                <button className="text-[11px] px-2 py-0.5 font-bold" style={{ background: DIM, color: "#dcfce7" }}>[CSV]</button>
              </div>
              <div className="text-[10px]" style={{ color: DIM }}>{"idx  PROVINSI                TPT(%)"}</div>
              <div style={{ color: DIM }}>{"─".repeat(44)}</div>
              {MOCK_ROWS.map(([prov, val], ri) => (
                <div key={ri} className="text-[11px] flex gap-3">
                  <span style={{ color: DIM }}>{String(ri).padStart(3,"0")}</span>
                  <span className="w-32 truncate" style={{ color: "#6ee7b7" }}>{prov}</span>
                  <span style={{ color: BRIGHT }}>{val}</span>
                </div>
              ))}
              <div className="text-[10px]" style={{ color: DIM }}>10/38 shown · sorted desc</div>
            </div>
          );

          if (block.type === "dw") return (
            <div key={i} className="pl-4 border-l-2" style={{ borderColor: DIM }}>
              <button onClick={() => setShowDW(s => !s)} className="text-xs flex items-center gap-1.5" style={{ color: GREEN }}>
                <BarChart2 className="w-3 h-3" />
                {showDW ? "[-]" : "[+]"} DATAWRAPPER EXPORT
              </button>
              {showDW && (
                <div className="mt-2 space-y-2 text-[11px]">
                  <div style={{ color: DIM }}>title=<input type="text" defaultValue="TPT menurut Provinsi, Nov 2025"
                    className="focus:outline-none px-2 py-0.5 w-56 text-[11px] ml-1"
                    style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO }} /></div>
                  <div style={{ color: DIM }}>type=<select className="px-2 py-0.5 focus:outline-none ml-1"
                    style={{ background: INPUT, border: `1px solid ${BORDER}`, color: LIGHT, fontFamily: MONO, fontSize: "11px" }}>
                    <option>d3-bars</option><option>column-chart</option>
                  </select></div>
                  <button className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold"
                    style={{ background: DIM, color: "#dcfce7" }}>
                    <BarChart2 className="w-3 h-3" />[PUSH_TO_DATAWRAPPER]
                  </button>
                </div>
              )}
            </div>
          );

          if (block.type === "err") return (
            <div key={i} className="text-xs pl-4 border-l-2" style={{ borderColor: "#7f1d1d", color: "#f87171" }}>
              [ERROR] {block.msg}
            </div>
          );

          return null;
        })}

        {loading && (
          <div className="text-xs pl-4 border-l-2 animate-pulse" style={{ borderColor: DIM, color: DIM }}>
            [FETCHING] Mengambil data dari BPS API…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── FIXED INPUT LINE ── */}
      <div className="flex-shrink-0" style={{ background: PANEL, borderTop: `1px solid ${BORDER}` }}>
        <div className="flex items-center px-4 py-2.5 gap-2">
          <span className="text-xs flex-shrink-0" style={{ color: BRIGHT }}>❯</span>
          <input
            ref={inputRef}
            type="text"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={handleKey}
            placeholder="fetch <url>  |  presets  |  help"
            className="flex-1 text-xs bg-transparent focus:outline-none"
            style={{ color: LIGHT, fontFamily: MONO, caretColor: BRIGHT }}
            disabled={loading}
            autoFocus
          />
          {loading && (
            <span className="text-[10px] flex-shrink-0" style={{ color: DIM }}>[CTRL+C to cancel]</span>
          )}
        </div>
        <div className="px-4 pb-2 text-[10px] flex items-center gap-4" style={{ color: DIM }}>
          <span>↑↓ history</span>
          <span>Enter execute</span>
          <span style={{ color: DIM, opacity: 0.5 }}>src: webapi.bps.go.id · viz: datawrapper.de</span>
        </div>
      </div>
    </div>
  );
}
