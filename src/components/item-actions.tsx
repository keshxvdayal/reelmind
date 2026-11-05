"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, FolderInput, Heart, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { btn, input } from "@/components/ui";

export function ItemActions({
  id,
  favorite,
  note,
  sectionId,
  sections,
}: {
  id: string;
  favorite: boolean;
  note: string;
  sectionId: string | null;
  sections: { id: string; name: string; emoji: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState(note);
  const [moving, setMoving] = useState(false);
  const [newName, setNewName] = useState("");

  async function patch(body: object, label: string) {
    setBusy(label);
    await fetch(`/api/saves/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(null);
    router.refresh();
  }

  async function reanalyse() {
    setBusy("reanalyse");
    await fetch(`/api/saves/${id}/reprocess`, { method: "POST" });
    setBusy(null);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this save from your library?")) return;
    setBusy("delete");
    await fetch(`/api/saves/${id}`, { method: "DELETE" });
    router.push("/app/library");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => patch({ favorite: !favorite }, "fav")} className={btn.ghost}>
          <Heart className={`h-4 w-4 ${favorite ? "fill-rose-500 text-rose-500" : ""}`} /> {favorite ? "Favourite" : "Add to favourites"}
        </button>
        <button onClick={() => setMoving((v) => !v)} className={btn.ghost}>
          <FolderInput className="h-4 w-4" /> Move
        </button>
        <button onClick={reanalyse} disabled={busy === "reanalyse"} className={btn.ghost}>
          <RefreshCw className={`h-4 w-4 ${busy === "reanalyse" ? "animate-spin" : ""}`} /> Re-analyse
        </button>
        <button onClick={remove} disabled={busy === "delete"} className={`${btn.ghost} text-rose-600 hover:bg-rose-50`}>
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      {moving && (
        <div className="rise space-y-3 rounded-2xl border border-line bg-canvas p-4">
          <p className="text-sm font-medium">Move to section</p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => patch({ sectionId: s.id }, "move").then(() => setMoving(false))}
                className={`rounded-full border px-3 py-1 text-sm transition ${s.id === sectionId ? "border-violet-400 bg-violet-50 text-violet-700" : "border-line bg-white hover:border-violet-300"}`}
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) void patch({ newSectionName: newName }, "move").then(() => setMoving(false));
            }}
            className="flex gap-2"
          >
            <input className={input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Or create a new section…" />
            <button className={btn.primary} disabled={!newName.trim()}>Create</button>
          </form>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Your note</p>
        <textarea className={`${input} min-h-20`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Why did you save this? Notes help the AI find it later." />
        {draft !== note && (
          <button onClick={() => patch({ note: draft }, "note")} className={btn.primary}>
            {busy === "note" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save note
          </button>
        )}
      </div>
    </div>
  );
}
