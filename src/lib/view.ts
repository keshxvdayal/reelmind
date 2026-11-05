import type { Db, Intent, Item, ItemKind, Reminder } from "@/lib/types";

export type ReminderView = { id: string; dueAt: string; note: string; done: boolean; sent: boolean; save: { id: string; title: string; emoji: string } };

/** The slice of an item the client components need. Keeps captions etc. off the wire where not needed. */
export type ItemView = {
  id: string;
  kind: ItemKind;
  title: string;
  summary: string;
  savedAt: string;
  status: Item["status"];
  hasMedia: boolean;
  favorite: boolean;
  intent: Intent | null;
  subtopic: string;
  tags: string[];
  places: string[];
  author: string | null;
  section: { slug: string; name: string; emoji: string } | null;
};

export function toView(db: Db, item: Item): ItemView {
  const s = item.sectionId ? db.sections.find((x) => x.id === item.sectionId) : undefined;
  const a = item.analysis;
  return {
    id: item.id,
    kind: item.kind,
    title: a?.title || item.caption.split("\n")[0]?.slice(0, 70) || item.note.slice(0, 70) || "New save",
    summary: a?.summary ?? "",
    savedAt: item.savedAt,
    status: item.status,
    hasMedia: item.hasMedia,
    favorite: item.favorite,
    intent: a?.intent ?? null,
    subtopic: a?.subtopic ?? "",
    tags: a?.tags ?? [],
    places: a?.places ?? [],
    author: item.author,
    section: s ? { slug: s.slug, name: s.name, emoji: s.emoji } : null,
  };
}

/** Targets for "Add to collection" and "Move" menus. */
export function pickerOptions(db: Db, userId: string) {
  return {
    collections: db.collections.filter((c) => c.userId === userId).map(({ id, name, emoji }) => ({ id, name, emoji })),
    sectionOptions: db.sections.filter((s) => s.userId === userId).map(({ id, name, emoji }) => ({ id, name, emoji })),
  };
}

export function reminderViews(db: Db, list: Reminder[]): ReminderView[] {
  return list.flatMap((r) => {
    const item = db.items.find((i) => i.id === r.itemId);
    if (!item) return [];
    const sec = db.sections.find((s) => s.id === item.sectionId);
    return [{ id: r.id, dueAt: r.dueAt, note: r.note, done: Boolean(r.doneAt), sent: Boolean(r.sentAt), save: { id: item.id, title: item.analysis?.title ?? "Save", emoji: sec?.emoji ?? "🗂️" } }];
  });
}

