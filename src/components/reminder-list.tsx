"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlarmClock, Check, Trash2 } from "lucide-react";
import { Card } from "@/components/ui";
import { call } from "@/lib/client-api";

import type { ReminderView } from "@/lib/view";
import { LOCALE } from "@/lib/format";

const fmt = (iso: string) => new Date(iso).toLocaleString(LOCALE, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function ReminderList({ reminders, empty }: { reminders: ReminderView[]; empty: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  async function run(id: string, body: object | null) {
    setBusy(id);
    await call(`/api/reminders/${id}`, body ? "PATCH" : "DELETE", body ?? undefined);
    setBusy(null);
    router.refresh();
  }
  if (!reminders.length) return <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">{empty}</p>;
  return (
    <Card className="divide-y divide-line">
      {reminders.map((r) => {
        const overdue = !r.done && new Date(r.dueAt) <= new Date();
        return (
          <div key={r.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${busy === r.id ? "opacity-50" : ""}`}>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${overdue ? "bg-amber-100" : "bg-canvas"}`}>{r.save.emoji}</span>
            <div className="min-w-0 flex-1">
              <Link href={`/app/saves/${r.save.id}`} className="block truncate text-sm font-medium hover:text-brand">
                {r.save.title}
              </Link>
              <p className={`text-xs ${overdue ? "font-medium text-amber-700" : "text-muted"}`} suppressHydrationWarning>
                {overdue ? "Due " : ""}
                {fmt(r.dueAt)}
                {r.note ? ` · ${r.note}` : ""}
                {r.sent ? " · sent to DMs" : ""}
              </p>
            </div>
            {!r.done && (
              <>
                <button onClick={() => run(r.id, { dueAt: new Date(Date.now() + 86400_000).toISOString() })} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted ring-1 ring-line hover:text-ink">
                  <AlarmClock className="h-3.5 w-3.5" /> Tomorrow
                </button>
                <button onClick={() => run(r.id, { done: true })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <Check className="h-3.5 w-3.5" /> Done
                </button>
              </>
            )}
            <button onClick={() => run(r.id, null)} className="rounded-lg p-1.5 text-muted hover:text-rose-600" aria-label="Delete reminder">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </Card>
  );
}
