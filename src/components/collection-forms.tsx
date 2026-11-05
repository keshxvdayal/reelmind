"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Copy, Globe, LoaderCircle, Lock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/modal";
import { btn, input } from "@/components/ui";
import { call } from "@/lib/client-api";

const EMOJIS = ["💜", "🏖️", "✈️", "🏔️", "🍜", "🎂", "💍", "🏋️", "🧘", "📚", "💼", "🎁", "🏡", "🎬", "🌱", "⭐"];

function CollectionFields({ value, onChange }: { value: { name: string; emoji: string; description: string }; onChange: (v: { name: string; emoji: string; description: string }) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Icon</p>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button type="button" key={e} onClick={() => onChange({ ...value, emoji: e })} className={`grid h-10 w-10 place-items-center rounded-xl text-lg ring-2 transition ${value.emoji === e ? "bg-violet-50 ring-violet-400" : "bg-canvas ring-transparent hover:ring-violet-200"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Name</span>
        <input className={input} value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="e.g. Goa trip, December" autoFocus />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">
          Description <span className="font-normal text-muted">(optional)</span>
        </span>
        <input className={input} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} placeholder="What's this collection for?" />
      </label>
    </div>
  );
}

export function NewCollectionButton({ itemIds, label = "New collection", onCreated }: { itemIds?: string[]; label?: string; onCreated?: (id: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ name: "", emoji: "💜", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await call<{ id: string }>("/api/collections", "POST", { ...v, itemIds });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setOpen(false);
    setV({ name: "", emoji: "💜", description: "" });
    if (onCreated) onCreated(r.data.id);
    else router.push(`/app/collections/${r.data.id}`);
    router.refresh();
  }
  return (
    <>
      <button onClick={() => setOpen(true)} className={btn.brand}>
        <Plus className="h-4 w-4" /> {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New collection" subtitle="Hand-pick saves for a trip, an event or a project.">
        <form onSubmit={submit} className="space-y-5">
          <CollectionFields value={v} onChange={setV} />
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={btn.ghost}>
              Cancel
            </button>
            <button disabled={busy || !v.name.trim()} className={btn.brand}>
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Create
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

type PickItem = { id: string; title: string; emoji: string; section: string };

export function CollectionToolbar({
  collection,
  shareUrl,
  candidates,
}: {
  collection: { id: string; name: string; emoji: string; description: string; shared: boolean; itemIds: string[] };
  shareUrl: string | null;
  candidates: PickItem[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [v, setV] = useState({ name: collection.name, emoji: collection.emoji, description: collection.description });
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const inColl = useMemo(() => new Set(collection.itemIds), [collection.itemIds]);
  const list = candidates.filter((c) => !inColl.has(c.id) && (!q.trim() || `${c.title} ${c.section}`.toLowerCase().includes(q.toLowerCase())));

  async function patch(body: object, label: string) {
    setBusy(label);
    await call(`/api/collections/${collection.id}`, "PATCH", body);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => setAdding(true)} className={btn.brand}>
        <Plus className="h-4 w-4" /> Add saves
      </button>
      <button onClick={() => patch({ share: !collection.shared }, "share")} className={btn.ghost}>
        {busy === "share" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : collection.shared ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
        {collection.shared ? "Stop sharing" : "Share link"}
      </button>
      {shareUrl && (
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className={btn.ghost}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
        </button>
      )}
      <button onClick={() => setEditing(true)} className={btn.ghost} aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={async () => {
          if (!confirm("Delete this collection? The saves stay in your library.")) return;
          await call(`/api/collections/${collection.id}`, "DELETE");
          router.push("/app/collections");
          router.refresh();
        }}
        className={btn.danger}
        aria-label="Delete collection"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit collection">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await patch(v, "edit");
            setEditing(false);
          }}
          className="space-y-5"
        >
          <CollectionFields value={v} onChange={setV} />
          <div className="flex justify-end">
            <button className={btn.brand} disabled={!v.name.trim()}>
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title={`Add to ${collection.name}`} subtitle="Pick saves from your library." wide>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className={`${input} pl-10`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your saves…" />
        </div>
        <div className="max-h-[48vh] space-y-1 overflow-y-auto">
          {list.length === 0 && <p className="py-8 text-center text-sm text-muted">No more saves to add.</p>}
          {list.map((c) => {
            const on = picked.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() =>
                  setPicked((s) => {
                    const n = new Set(s);
                    if (on) n.delete(c.id);
                    else n.add(c.id);
                    return n;
                  })
                }
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${on ? "bg-violet-50 ring-1 ring-violet-300" : "hover:bg-canvas"}`}
              >
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${on ? "border-violet-600 bg-violet-600 text-white" : "border-line"}`}>{on && <Check className="h-3 w-3" />}</span>
                <span className="text-lg">{c.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <span className="shrink-0 text-xs text-muted">{c.section}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">{picked.size} selected</p>
          <button
            disabled={!picked.size || busy === "add"}
            onClick={async () => {
              await patch({ add: [...picked] }, "add");
              setPicked(new Set());
              setAdding(false);
            }}
            className={btn.brand}
          >
            {busy === "add" && <LoaderCircle className="h-4 w-4 animate-spin" />} Add {picked.size || ""}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function RemoveFromCollection({ collectionId, itemId }: { collectionId: string; itemId: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await call(`/api/collections/${collectionId}`, "PATCH", { remove: [itemId] });
        router.refresh();
      }}
      className="absolute right-2 top-2 z-10 hidden rounded-full bg-white/90 p-1.5 text-muted shadow hover:text-rose-600 group-hover/card:block"
      aria-label="Remove from collection"
      title="Remove from collection"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
