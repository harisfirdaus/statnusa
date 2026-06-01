import { useState, useEffect } from "react";
import { Database, Eye, EyeOff, Loader2 } from "lucide-react";
import { getAuthStatus, verifyPassword } from "@/lib/api";

const SESSION_KEY = "statnusa_auth";

interface Props { children: React.ReactNode; }

export function PasswordGate({ children }: Props) {
  const [required, setRequired]   = useState<boolean | null>(null);
  const [unlocked, setUnlocked]   = useState(false);
  const [input, setInput]         = useState("");
  const [show, setShow]           = useState(false);
  const [error, setError]         = useState(false);
  const [shaking, setShaking]     = useState(false);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setUnlocked(true);
      return;
    }
    getAuthStatus()
      .then(({ required: r }) => {
        setRequired(r);
        if (!r) setUnlocked(true);
      })
      .catch(() => {
        setRequired(false);
        setUnlocked(true);
      });
  }, []);

  if (unlocked) return <>{children}</>;
  if (required === null) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const { ok } = await verifyPassword(input);
      if (ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setUnlocked(true);
      } else {
        setError(true);
        setShaking(true);
        setInput("");
        setTimeout(() => setShaking(false), 500);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-neutral-900 text-white flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">StatNusa</h1>
            <p className="text-xs text-neutral-400">Masukkan kata sandi untuk melanjutkan</p>
          </div>
        </div>

        <div className="border-t border-neutral-200" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div style={{ animation: shaking ? "shake 0.4s ease" : undefined }}>
            <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                autoFocus
                type={show ? "text" : "password"}
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(false); }}
                placeholder="••••••••"
                className={`w-full px-3 py-2.5 pr-10 text-sm border focus:outline-none transition-colors bg-white ${
                  error
                    ? "border-red-400 focus:border-red-600 text-red-700"
                    : "border-neutral-300 focus:border-neutral-900 text-neutral-700"
                }`}
              />
              <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-600">Kata sandi salah. Coba lagi.</p>}
          </div>

          <button type="submit" disabled={!input.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold tracking-wide bg-neutral-900 text-white hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Memverifikasi…</> : "MASUK"}
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
