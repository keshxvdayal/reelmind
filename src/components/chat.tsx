"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LoaderCircle, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { Answer, type Catalog } from "@/components/answer";

type Msg = { role: "user" | "assistant"; text: string; itemIds?: string[]; status?: string; error?: string; streaming?: boolean };
type ChatSummary = { id: string; title: string; updatedAt: string };

const STARTERS = [
  "Remember the travel reel I saved a few months ago? Find it",
  "Plan a 4-day trip using everything I saved about travel",
  "Make me a weekly workout from my fitness saves",
  "What did I save that can help when I'm overthinking?",
  "Give me a shopping list from the recipes I saved",
  "What have I saved the most about lately?",
];

export function Chat({
  catalog,
  chats,
  initialChat,
  initialQuestion,
  aiReady,
}: {
  catalog: Catalog;
  chats: ChatSummary[];
  initialChat: { id: string; messages: Msg[] } | null;
  initialQuestion: string | null;
  aiReady: boolean;
}) {
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(initialChat?.id ?? null);
  const [messages, setMessages] = useState<Msg[]>(initialChat?.messages ?? []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (initialQuestion && !asked.current) {
      asked.current = true;
      void ask(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  function patchLast(fn: (m: Msg) => Msg) {
    setMessages((ms) => [...ms.slice(0, -1), fn(ms[ms.length - 1])]);
  }

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    setMessages((ms) => [...ms, { role: "user", text: question }, { role: "assistant", text: "", streaming: true, status: "Thinking" }]);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId, question }) });
      if (!res.ok || !res.body) {
        const err = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong.";
        patchLast((m) => ({ ...m, streaming: false, error: err }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let newChat: string | null = null;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as
            | { type: "chat"; chatId: string }
            | { type: "status"; text: string }
            | { type: "text"; text: string }
            | { type: "done"; text: string; itemIds: string[] }
            | { type: "error"; error: string };
          if (ev.type === "chat") newChat = ev.chatId;
          else if (ev.type === "status") patchLast((m) => ({ ...m, status: ev.text }));
          else if (ev.type === "text") patchLast((m) => ({ ...m, text: m.text + ev.text, status: undefined }));
          else if (ev.type === "done") patchLast((m) => ({ ...m, text: ev.text || m.text, itemIds: ev.itemIds, streaming: false, status: undefined }));
          else if (ev.type === "error") patchLast((m) => ({ ...m, streaming: false, status: undefined, error: ev.error }));
        }
      }
      if (newChat && newChat !== chatId) {
        setChatId(newChat);
        window.history.replaceState(null, "", `/app/ask?chat=${newChat}`);
      }
      router.refresh();
    } catch {
      patchLast((m) => ({ ...m, streaming: false, error: "Connection lost. Try again." }));
    } finally {
      setBusy(false);
    }
  }

  async function removeChat(id: string) {
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    if (id === chatId) newConversation();
    router.refresh();
  }

  function newConversation() {
    setChatId(null);
    setMessages([]);
    window.history.replaceState(null, "", "/app/ask");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
      <div className="flex min-h-[70vh] flex-col">
        {messages.length === 0 ? (
          <div className="rise flex flex-1 flex-col items-center justify-center py-10 text-center">
            <div className="brand-gradient mb-4 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              What are you trying to <span className="font-display italic brand-text">remember?</span>
            </h1>
            <p className="mt-1 max-w-md text-sm text-muted">Ask about anything you saved, even vaguely. I can also turn your saves into plans, lists and routines.</p>
            {!aiReady && (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
                Add <code>GEMINI_API_KEY</code> (or <code>ANTHROPIC_API_KEY</code>) to <code>.env.local</code> to turn on AI answers.
              </p>
            )}
            <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-left text-sm text-ink/80 transition hover:border-violet-300 hover:bg-violet-50/50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-6 pb-6">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] text-white">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <div className="brand-gradient mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {m.status && (
                      <p className="mb-2 flex items-center gap-2 text-sm text-muted">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> {m.status}…
                      </p>
                    )}
                    {m.text && <Answer text={m.text} catalog={catalog} />}
                    {m.error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{m.error}</p>}
                    {!m.streaming && m.itemIds && m.itemIds.length > 0 && <Sources ids={m.itemIds} catalog={catalog} />}
                  </div>
                </div>
              ),
            )}
            <div ref={bottom} />
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
          className="sticky bottom-4 flex items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-[0_10px_40px_-15px_rgba(76,29,149,0.35)]"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask(input);
              }
            }}
            rows={1}
            placeholder="e.g. that Lisbon café reel I saved in summer…"
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted/70"
          />
          <button type="submit" disabled={busy || !input.trim()} className="brand-gradient grid h-11 w-11 place-items-center rounded-xl text-white transition disabled:opacity-40" aria-label="Send">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>

      <aside className="hidden lg:block">
        <button onClick={newConversation} className="mb-3 flex w-full items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium transition hover:bg-canvas">
          <Plus className="h-4 w-4" /> New conversation
        </button>
        <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Recent</p>
        <div className="space-y-0.5">
          {chats.length === 0 && <p className="px-1 text-xs text-muted">Your conversations appear here.</p>}
          {chats.map((c) => (
            <div key={c.id} className={`group flex items-center rounded-lg ${c.id === chatId ? "bg-brand-soft" : "hover:bg-white"}`}>
              <Link href={`/app/ask?chat=${c.id}`} className="flex-1 truncate px-2.5 py-1.5 text-[13px] text-ink/80">
                {c.title}
              </Link>
              <button onClick={() => removeChat(c.id)} className="hidden p-1.5 text-muted hover:text-rose-600 group-hover:block" aria-label="Delete conversation">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Sources({ ids, catalog }: { ids: string[]; catalog: Catalog }) {
  const items = ids.map((id) => catalog[id]).filter(Boolean);
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">From your saves</p>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {items.map((it) => (
          <Link key={it.id} href={`/app/saves/${it.id}`} className="flex w-52 shrink-0 items-start gap-2.5 rounded-xl border border-line bg-white p-2.5 transition hover:border-violet-300">
            <span className="text-xl">{it.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-[13px] font-medium leading-snug">{it.title}</span>
              <span className="text-[11px] text-muted">{it.section}</span>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
