"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { Modal } from "@/components/modal";
import { btn, input } from "@/components/ui";

export function AddSave({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/saves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, caption, note }) });
    setBusy(false);
    if (!res.ok) {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not save.");
      return;
    }
    setUrl("");
    setCaption("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={compact ? btn.primary : btn.brand}>
        <Plus className="h-4 w-4" /> <span className={compact ? "hidden sm:inline" : ""}>Add a save</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a save" subtitle="The fastest way is sharing reels to the bot on Instagram. You can also paste one here.">
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Instagram link</span>
            <input className={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/…" autoFocus />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              Caption <span className="font-normal text-muted">(paste it if you can: it makes sorting much better)</span>
            </span>
            <textarea className={`${input} min-h-24`} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Copy the caption from Instagram…" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Your note</span>
            <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. for our Goa trip in December" />
          </label>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={btn.ghost}>
              Cancel
            </button>
            <button disabled={busy || (!url.trim() && !caption.trim() && !note.trim())} className={btn.brand}>
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
