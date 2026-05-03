import { useState, useEffect } from "react";
import { BarChart2, Lock, Eye, EyeOff } from "lucide-react";

const SESSION_KEY = "statnusa_auth";
const PASSWORD = import.meta.env.VITE_APP_PASSWORD as string | undefined;

interface Props {
  children: React.ReactNode;
}

export function PasswordGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-neutral-900 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">StatNusa</h1>
            <p className="text-xs text-neutral-400">Ekstrak &amp; Visualisasi Data BPS</p>
          </div>
        </div>

        <div className="h-px bg-neutral-100" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-neutral-700">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Masukkan kata sandi untuk melanjutkan</span>
          </div>

          <div
            className="relative"
            style={{ animation: shaking ? "shake 0.4s ease" : undefined }}
          >
            <input
              autoFocus
              type={show ? "text" : "password"}
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              placeholder="Kata sandi"
              className={`w-full px-3 py-2.5 pr-10 text-sm border rounded-none outline-none transition-colors ${
                error
                  ? "border-red-400 bg-red-50 text-red-900"
                  : "border-neutral-200 focus:border-neutral-900"
              }`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
              tabIndex={-1}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600">Kata sandi salah. Coba lagi.</p>
          )}

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Masuk
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
