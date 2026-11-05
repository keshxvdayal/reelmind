"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckSquare, FolderHeart, FolderInput, Heart, LayoutGrid, List, LoaderCircle, Search, Trash2, X } from "lucide-react";
import { ItemGrid, ItemRow } from "@/components/item-card";
import { Card, Empty, input } from "@/components/ui";
import { call } from "@/lib/client-api";
import { INTENT_LABEL, type Intent } from "@/lib/types";
import type { ItemView } from "@/lib/view";

type Opt = { id: string; name: string; emoji: string };

/** Instant client-side filtering over the user's saves, with select mode for bulk actions. */
export function LibraryView({
  items,
  sections,
  showSectionFilter = true,
  collections = [],
  sectionOptions = [],
}: {
  items: ItemView[];
  sections: { slug: string; name: string; emoji: string }[];
  showSectionFilter?: boolean;
  collections?: Opt[];
  sectionOptions?: Opt[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [section, setSection] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [favs, setFavs] = useState(false);
  const [sort, setSort] = useState<"new" | "old" | "az">("new");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<"move" | "collect" | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const intents = useMemo(() => [...new Set(items.map((i) => i.intent).filter(Boolean))] as Intent[], [items]);
  const subtopics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of items) if (i.subtopic) counts.set(i.subtopic, (counts.get(i.subtopic) ?? 0) + 1);
    return [...counts].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([s]) => s);
  }, [items]);

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = items.filter((i) => {
      if (section && i.section?.slug !== section) return false;
      if (intent && i.intent !== intent) return false;
      if (sub && i.subtopic !== sub) return false;
      if (favs && !i.favorite) return false;
      if (!words.length) return true;
      const hay = `${i.title} ${i.summary} ${i.subtopic} ${i.tags.join(" ")} ${i.places.join(" ")} ${i.section?.name ?? ""} ${i.author ?? ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    if (sort === "old") return [...list].reverse();
    if (sort === "az") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [items, q, section, intent, sub, favs, sort]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-[13px] transition ${active ? "border-violet-400 bg-violet-50 font-medium text-violet-700" : "border-line bg-white text-ink/75 hover:border-violet-300"}`;

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  function exitSelect() {
    setSelecting(false);
    setSelected(new Set());
    setMenu(null);
  }

  async function bulk(action: string, extra: object = {}, label = "Done") {
    if (action === "delete" && !confirm(`Delete ${selected.size} save${selected.size === 1 ? "" : "s"}? This can't be undone.`)) return;
    setBusy(true);
    const r = await call("/api/saves/bulk", "POST", { ids: [...selected], action, ...extra });
    setBusy(false);
    setToast(r.ok ? label : r.error);
    setTimeout(() => setToast(null), 2500);
    if (r.ok) {
      exitSelect();
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className={`${input} pl-10`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by word, place, tag, creator…" />
        </div>
        <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" value={sort} onChange={(e) => setSort(e.target.value as "new" | "old" | "az")}>
          <option value="new">Newest first</option>
          <option value="old">Oldest first</option>
          <option value="az">A to Z</option>
        </select>
        <button onClick={() => setFavs((v) => !v)} className={`${chip(favs)} inline-flex items-center gap-1.5 !py-2`}>
          <Heart className={`h-3.5 w-3.5 ${favs ? "fill-rose-500 text-rose-500" : ""}`} /> Favourites
        </button>
        <div className="flex rounded-xl border border-line bg-white p-0.5">
          <button onClick={() => setView("grid")} className={`rounded-lg p-2 ${view === "grid" ? "bg-canvas text-ink" : "text-muted"}`} aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-canvas text-ink" : "text-muted"}`} aria-label="List view">
            <List className="h-4 w-4" />
          </button>
        </div>
        <button onClick={() => (selecting ? exitSelect() : setSelecting(true))} className={`${chip(selecting)} inline-flex items-center gap-1.5 !py-2`}>
          <CheckSquare className="h-3.5 w-3.5" /> {selecting ? "Cancel" : "Select"}
        </button>
      </div>

      {showSectionFilter && sections.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button className={chip(!section)} onClick={() => setSection(null)}>
            All sections
          </button>
          {sections.map((s) => (
            <button key={s.slug} className={chip(section === s.slug)} onClick={() => setSection(section === s.slug ? null : s.slug)}>
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      )}
      {!showSectionFilter && subtopics.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button className={chip(!sub)} onClick={() => setSub(null)}>
            All topics
          </button>
          {subtopics.map((s) => (
            <button key={s} className={chip(sub === s)} onClick={() => setSub(sub === s ? null : s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      {intents.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {intents.map((it) => (
            <button key={it} className={chip(intent === it)} onClick={() => setIntent(intent === it ? null : it)}>
              {INTENT_LABEL[it]}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted">
        <p>
          {shown.length} of {items.length} saves
        </p>
        {selecting && (
          <button onClick={() => setSelected(new Set(shown.map((i) => i.id)))} className="font-medium text-brand">
            Select all {shown.length}
          </button>
        )}
      </div>
      {shown.length === 0 ? (
        <Empty icon={<Search className="h-5 w-5" />} title="Nothing matches">
          Try fewer words, or ask the AI. It understands vague questions.
        </Empty>
      ) : view === "grid" || selecting ? (
        <ItemGrid items={shown} showSection={showSectionFilter} selected={selected} onSelect={selecting ? toggle : undefined} />
      ) : (
        <Card className="divide-y divide-line p-1.5">
          {shown.map((i) => (
            <ItemRow key={i.id} item={i} />
          ))}
        </Card>
      )}

      {selecting && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 lg:pl-[260px]">
          <div className="rise relative flex flex-wrap items-center gap-1.5 rounded-2xl bg-ink p-2 pl-4 text-sm text-white shadow-2xl">
            <span className="mr-2 font-medium">{selected.size} selected</span>
            {collections.length > 0 && (
              <BarButton onClick={() => setMenu(menu === "collect" ? null : "collect")} icon={<FolderHeart className="h-4 w-4" />} label="Add to collection" />
            )}
            {sectionOptions.length > 0 && <BarButton onClick={() => setMenu(menu === "move" ? null : "move")} icon={<FolderInput className="h-4 w-4" />} label="Move" />}
            <BarButton onClick={() => bulk("favorite", {}, "Added to favourites")} icon={<Heart className="h-4 w-4" />} label="Favourite" />
            <BarButton onClick={() => bulk("delete", {}, "Deleted")} icon={<Trash2 className="h-4 w-4 text-rose-300" />} label="Delete" />
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
            <button onClick={exitSelect} className="rounded-lg p-2 text-white/60 hover:bg-white/10" aria-label="Cancel">
              <X className="h-4 w-4" />
            </button>
            {menu && (
              <div className="absolute bottom-full left-0 mb-2 max-h-72 w-72 overflow-y-auto rounded-2xl border border-line bg-white p-1.5 text-ink shadow-2xl">
                {(menu === "collect" ? collections : sectionOptions).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => (menu === "collect" ? bulk("collect", { collectionId: o.id }, `Added to ${o.name}`) : bulk("move", { sectionId: o.id }, `Moved to ${o.name}`))}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas"
                  >
                    {o.emoji} {o.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {toast && <div className="rise fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm text-white shadow-xl">{toast}</div>}
    </div>
  );
}

function BarButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 transition hover:bg-white/10">
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
