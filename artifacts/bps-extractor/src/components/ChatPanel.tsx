import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, MessageCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamChat, type ChatMessage } from "@/lib/api";
import type { ParsedTable } from "@/lib/parsers";

function buildTableContext(table: ParsedTable, columns: string[]): string {
  const lines: string[] = [];
  lines.push(`Judul: ${table.title}`);
  if (table.source) lines.push(`Sumber: ${table.source}`);
  if (table.unit)   lines.push(`Satuan: ${table.unit}`);
  if (table.subtitle) lines.push(`Info: ${table.subtitle}`);
  lines.push("");
  lines.push(columns.join(" | "));
  lines.push(columns.map(() => "---").join(" | "));
  const MAX_ROWS = 150;
  const rows = table.rows.slice(0, MAX_ROWS);
  for (const row of rows) {
    lines.push(row.map((c) => (c === null ? "-" : String(c))).join(" | "));
  }
  if (table.rows.length > MAX_ROWS) {
    lines.push(`... (${table.rows.length - MAX_ROWS} baris lainnya tidak ditampilkan)`);
  }
  return lines.join("\n");
}

const DW_DESCRIPTION_PROMPT =
  "Tulis deskripsi singkat untuk grafik Datawrapper berdasarkan data ini. " +
  "Maksimal 2 kalimat: kalimat pertama menjelaskan apa yang ditampilkan, " +
  "kalimat kedua menyebutkan temuan/insight paling menonjol dari data. " +
  "Gunakan bahasa Indonesia yang ringkas dan lugas, tanpa bullet point atau markdown.";

const SUGGESTIONS = [
  "Mana nilai tertinggi dan terendah?",
  "Berikan ringkasan data ini.",
  "Apa tren yang terlihat dari data ini?",
  "Bandingkan 5 nilai teratas.",
];

interface Props {
  table: ParsedTable;
  columns: string[];
}

export function ChatPanel({ table, columns }: Props) {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [input, setInput]         = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);
  const abortRef                  = useRef(false);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setError(null);
    setStreaming(true);
    abortRef.current = false;

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages([...next, assistantMsg]);

    try {
      const ctx = buildTableContext(table, columns);
      const gen = streamChat(next, ctx);
      for await (const chunk of gen) {
        if (abortRef.current) break;
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      }
    } catch (err: any) {
      const raw: string = err.message ?? "";
      let friendly = raw;
      if (raw.includes("DEGRADED") || raw.includes("sedang tidak tersedia"))
        friendly = "Semua model AI sedang tidak tersedia di server NVIDIA. Coba lagi dalam beberapa menit.";
      else if (raw.includes("504") || raw.includes("timeout") || raw.toLowerCase().includes("Timeout"))
        friendly = "Permintaan timeout — model membutuhkan terlalu banyak waktu. Coba pertanyaan yang lebih singkat.";
      else if (raw.includes("429"))
        friendly = "Terlalu banyak permintaan ke NVIDIA API. Tunggu sebentar lalu coba lagi.";
      else if (raw.includes("401") || raw.includes("403"))
        friendly = "NVIDIA API key tidak valid atau tidak memiliki akses. Hubungi administrator.";
      else if (raw.includes("500"))
        friendly = "Terjadi kesalahan internal di server NVIDIA. Coba lagi.";
      setError(friendly);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, table, columns]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function clearChat() {
    abortRef.current = true;
    setMessages([]);
    setError(null);
    setStreaming(false);
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5" />
          Tanya Data dengan AI
          <span className="font-normal normal-case tracking-normal text-neutral-400 dark:text-neutral-500 text-[10px]">
            Gemma 3 27B · {table.rows.length} baris
          </span>
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 flex flex-col" style={{ height: "480px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white dark:bg-neutral-900">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5" />
                  </span>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Halo! Saya siap membantu menganalisis data <span className="font-semibold text-neutral-900 dark:text-neutral-100">{table.title}</span>.
                    Silakan tanyakan apa saja tentang data ini.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pl-9">
                  <button
                    onClick={() => send(DW_DESCRIPTION_PROMPT)}
                    className="text-xs px-3 py-1.5 border border-neutral-900 dark:border-neutral-300 text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-neutral-100 hover:text-white dark:hover:text-neutral-900 transition-colors font-medium flex items-center gap-1.5"
                  >
                    <span>✦</span> Buat deskripsi untuk grafik Datawrapper
                  </button>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-900 dark:hover:border-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center ${
                  msg.role === "user"
                    ? "bg-neutral-200 dark:bg-neutral-700"
                    : "bg-neutral-900 dark:bg-neutral-100"
                }`}>
                  {msg.role === "user"
                    ? <User className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                    : <Bot  className="w-3.5 h-3.5 text-white dark:text-neutral-900" />}
                </span>
                <div className={`max-w-[80%] text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-neutral-800 dark:text-neutral-200 text-right whitespace-pre-wrap"
                    : "text-neutral-700 dark:text-neutral-300 prose prose-sm prose-neutral dark:prose-invert max-w-none"
                }`}>
                  {msg.role === "assistant" ? (
                    <>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{children}</strong>,
                          ul:     ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                          ol:     ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                          li:     ({ children }) => <li className="leading-relaxed">{children}</li>,
                          h1:     ({ children }) => <h1 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-3 mb-1.5">{children}</h1>,
                          h2:     ({ children }) => <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-3 mb-1.5">{children}</h2>,
                          h3:     ({ children }) => <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-2 mb-1">{children}</h3>,
                          code:   ({ children, className }) => className
                            ? <code className="block bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono px-3 py-2 my-1.5 overflow-x-auto">{children}</code>
                            : <code className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono px-1 py-0.5">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-neutral-300 dark:border-neutral-600 pl-3 italic text-neutral-500 dark:text-neutral-400 my-1.5">{children}</blockquote>,
                          hr:     () => <hr className="border-neutral-200 dark:border-neutral-700 my-2" />,
                          table:  ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
                          th:     ({ children }) => <th className="border border-neutral-300 dark:border-neutral-600 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 font-semibold text-left">{children}</th>,
                          td:     ({ children }) => <td className="border border-neutral-300 dark:border-neutral-600 px-2 py-1">{children}</td>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {streaming && i === messages.length - 1 && msg.content === "" && (
                        <span className="inline-flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Sedang berpikir…
                        </span>
                      )}
                      {streaming && i === messages.length - 1 && msg.content !== "" && (
                        <span className="inline-block w-0.5 h-3.5 bg-neutral-400 dark:bg-neutral-500 ml-0.5 animate-pulse align-middle" />
                      )}
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 flex items-end gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                title="Hapus percakapan"
                className="flex-shrink-0 p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors mb-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <form onSubmit={handleSubmit} className="flex-1 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanyakan sesuatu tentang data… (Enter untuk kirim)"
                rows={1}
                disabled={streaming}
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300 resize-none bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 transition-colors disabled:opacity-50"
                style={{ minHeight: "38px", maxHeight: "100px" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-white transition-colors disabled:opacity-40"
              >
                {streaming
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
