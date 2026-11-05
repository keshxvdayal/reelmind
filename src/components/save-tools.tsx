"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Check, FolderHeart, ListPlus, LoaderCircle, Plus } from "lucide-react";
import { NewCollectionButton } from "@/components/collection-forms";
import { btn, input } from "@/components/ui";
import { call } from "@/lib/client-api";

/** Records a view once per page load. */
export function ViewTracker({ id }: { id: string }) {
  useEffect(() => {
    void fetch(`/api/saves/${id}/view`, { method: "POST" });
  }, [id]);
  return null;
}

export function CollectionPicker({ itemId, collections }: { itemId: string; collections: { id: string; name: string; emoji: string; has: boolean }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-medium">
        <FolderHeart className="h-4 w-4 text-violet-500" /> Collections
      </p>
      <div className="flex flex-wrap gap-1.5">
        {collections.map((c) => (
          <button
            key={c.id}
            disabled={busy === c.id}
            onClick={async () => {
              setBusy(c.id);
              await call(`/api/collections/${c.id}`, "PATCH", c.has ? { remove: [itemId] } : { add: [itemId] });
              setBusy(null);
              router.refresh();
            }}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[13px] transition ${c.has ? "border-violet-400 bg-violet-50 text-violet-700" : "border-line bg-white hover:border-violet-300"}`}
          >
            {c.has ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-muted" />} {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <div className="[&_button]:!px-3 [&_button]:!py-1.5 [&_button]:!text-[13px]">
        <NewCollectionButton itemIds={[itemId]} label="New collection" onCreated={() => router.refresh()} />
      </div>
    </div>
  );
}

function presets(): { label: string; at: Date }[] {
  const now = new Date();
  const at = (days: number, hour = 9) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const toSat = (6 - now.getDay() + 7) % 7 || 7;
  return [
    { label: "Tomorrow", at: at(1) },
    { label: "This weekend", at: at(toSat, 10) },
    { label: "Next week", at: at(7) },
    { label: "In a month", at: at(30) },
  ];
}

export function RemindMe({ itemId, upcoming }: { itemId: string; upcoming: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function set(at: Date) {
    setBusy(true);
    await call("/api/reminders", "POST", { itemId, dueAt: at.toISOString(), note });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }
  return (
    <div className="space-y-2">
      <button onClick={() => setOpen((v) => !v)} className={`${btn.ghost} w-full justify-start`}>
        <Bell className="h-4 w-4 text-violet-500" />
        {upcoming ? <span suppressHydrationWarning>Reminder: {new Date(upcoming).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span> : "Remind me"}
        {busy && <LoaderCircle className="ml-auto h-4 w-4 animate-spin" />}
      </button>
      {open && (
        <div className="rise space-y-3 rounded-2xl border border-line bg-canvas p-3">
          <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional), e.g. book tickets" />
          <div className="grid grid-cols-2 gap-1.5">
            {presets().map((p) => (
              <button key={p.label} onClick={() => set(p.at)} className="rounded-xl bg-white px-3 py-2 text-left text-sm ring-1 ring-line hover:ring-violet-300">
                <span className="block font-medium">{p.label}</span>
                <span className="text-[11px] text-muted" suppressHydrationWarning>
                  {p.at.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="date" className={input} value={custom} onChange={(e) => setCustom(e.target.value)} />
            <button disabled={!custom} onClick={() => set(new Date(`${custom}T09:00:00`))} className={btn.primary}>
              Set
            </button>
          </div>
        </div>
      )}
      {upcoming && (
        <Link href="/app/reminders" className="block px-1 text-xs text-muted hover:text-brand">
          Manage reminders →
        </Link>
      )}
    </div>
  );
}

export function AddToTryList({ itemId, actions, added }: { itemId: string; actions: string[]; added: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const remaining = actions.length - added;
  if (!actions.length) return null;
  return (
    <button
      disabled={busy || remaining <= 0}
      onClick={async () => {
        setBusy(true);
        await call("/api/todos", "POST", { itemId, texts: actions });
        setBusy(false);
        router.refresh();
      }}
      className={`${btn.ghost} text-[13px]`}
    >
      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : remaining <= 0 ? <Check className="h-4 w-4 text-emerald-500" /> : <ListPlus className="h-4 w-4" />}
      {remaining <= 0 ? "On your try list" : "Add to try list"}
    </button>
  );
}
