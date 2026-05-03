import { useState, useEffect } from "react";
import { Terminal, Eye, EyeOff } from "lucide-react";

const MONO   = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
const BG     = "#0a0f0a";
const PANEL  = "#0d130d";
const INPUT  = "#060c06";
const BRIGHT = "#4ade80";
const LIGHT  = "#86efac";
const DIM    = "#166534";
const BORDER = "#14532d";

const SESSION_KEY = "statnusa_auth";
const PASSWORD    = import.meta.env.VITE_APP_PASSWORD as string | undefined;

interface Props { children: React.ReactNode; }

export function PasswordGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput]       = useState("");
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState(false);
  const [shaking, setShaking]   = useState(false);

  useEffect(() => {
    if (!PASSWORD) { setUnlocked(true); return; }
    if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
  }, []);

  if (!PASSWORD || unlocked) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setShaking(true);
      setInput("");
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: BG, fontFamily: MONO }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 flex-shrink-0" style={{ color: BRIGHT }} />
          <div>
            <span className="text-sm font-bold" style={{ color: BRIGHT }}>StatNusa</span>
            <span className="text-xs ml-3" style={{ color: DIM }}>auth required</span>
          </div>
        </div>

        <div style={{ height: "1px", background: BORDER }} />

        <div className="text-xs space-y-1" style={{ color: DIM }}>
          <div><span style={{ color: BRIGHT }}>$</span> statnusa --auth</div>
          <div>Enter password to continue</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            style={{ animation: shaking ? "shake 0.4s ease" : undefined }}
            className="text-xs"
          >
            <div className="mb-1" style={{ color: DIM }}>password=</div>
            <div className="relative">
              <input
                autoFocus
                type={show ? "text" : "password"}
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(false); }}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 text-xs focus:outline-none"
                style={{
                  background: error ? "#1a0000" : INPUT,
                  border: `1px solid ${error ? "#7f1d1d" : BORDER}`,
                  color: error ? "#fca5a5" : LIGHT,
                  fontFamily: MONO,
                }}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: DIM }}
              >
                {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            {error && <p className="mt-1 text-xs" style={{ color: "#f87171" }}>[ERROR] kata sandi salah. coba lagi.</p>}
          </div>

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full py-2.5 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: DIM, color: "#dcfce7", border: "none" }}
          >
            [AUTHENTICATE]
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
