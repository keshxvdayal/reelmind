"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, LoaderCircle, Plus, Sparkles, Trash2 } from "lucide-react";
import { btn, Card, input } from "@/components/ui";
import { call } from "@/lib/client-api";

export type TodoView = { id: string; text: string; done: boolean; doneAt: string | null; save: { id: string; title: string; emoji: string } | null };
export type Suggestion = { itemId: string; text: string; title: string; emoji: string };

export function TodoBoard({ todos, suggestions }: { todos: TodoView[]; suggestions: Suggestion[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    await fn();
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            void run("add", () => call("/api/todos", "POST", { text })).then(() => setText(""));
          }}
          className="flex gap-2"
        >
          <input className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add something you want to try…" />
          <button className={btn.primary} disabled={!text.trim() || busy === "add"}>
            {busy === "add" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
        </form>

        <Card className="divide-y divide-line">
          {open.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">Nothing on your list. Add one above, or pick a suggestion from your saves.</p>}
          {open.map((t) => (
            <Row key={t.id} t={t} busy={busy === t.id} onToggle={() => run(t.id, () => call(`/api/todos/${t.id}`, "PATCH", { done: true }))} onDelete={() => run(t.id, () => call(`/api/todos/${t.id}`, "DELETE"))} />
          ))}
        </Card>

        {done.length > 0 && (
          <div>
            <button onClick={() => setShowDone((v) => !v)} className="mb-2 text-sm font-medium text-muted hover:text-ink">
              {showDone ? "Hide" : "Show"} {done.length} done
            </button>
            {showDone && (
              <Card className="divide-y divide-line">
                {done.map((t) => (
                  <Row key={t.id} t={t} busy={busy === t.id} onToggle={() => run(t.id, () => call(`/api/todos/${t.id}`, "PATCH", { done: false }))} onDelete={() => run(t.id, () => call(`/api/todos/${t.id}`, "DELETE"))} />
                ))}
              </Card>
            )}
          </div>
        )}
      </div>

      <aside>
        <Card className="p-5">
          <p className="mb-1 flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-violet-500" /> From your saves
          </p>
          <p className="mb-4 text-xs text-muted">Things the AI spotted you could actually do.</p>
          {suggestions.length === 0 && <p className="text-sm text-muted">No new ideas right now. They appear as you save more.</p>}
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={`${s.itemId}-${s.text}`} className="rounded-xl bg-canvas p-3">
                <p className="text-sm">{s.text}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Link href={`/app/saves/${s.itemId}`} className="truncate text-xs text-muted hover:text-brand">
                    {s.emoji} {s.title}
                  </Link>
                  <button onClick={() => run(`s-${s.itemId}`, () => call("/api/todos", "POST", { text: s.text, itemId: s.itemId }))} className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-medium text-brand ring-1 ring-line hover:ring-violet-300">
                    {busy === `s-${s.itemId}` ? "…" : "+ Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}

function Row({ t, busy, onToggle, onDelete }: { t: TodoView; busy: boolean; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="group flex items-start gap-3 px-4 py-3">
      <button onClick={onToggle} disabled={busy} className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${t.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-violet-300 hover:border-violet-500"}`} aria-label={t.done ? "Mark not done" : "Mark done"}>
        {t.done && <Check className="h-3 w-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${t.done ? "text-muted line-through" : ""}`}>{t.text}</p>
        {t.save && (
          <Link href={`/app/saves/${t.save.id}`} className="mt-0.5 block truncate text-xs text-muted hover:text-brand">
            {t.save.emoji} {t.save.title}
          </Link>
        )}
      </div>
      <button onClick={onDelete} className="rounded-lg p-1 text-muted opacity-0 transition hover:text-rose-600 group-hover:opacity-100" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
