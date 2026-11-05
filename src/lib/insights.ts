import { userItems } from "@/lib/library";
import type { Db, Item } from "@/lib/types";

export type PlaceSummary = { name: string; count: number; itemIds: string[]; sections: string[]; latest: string };

/** Every named place across the user's saves, merged case-insensitively. */
export function placesOf(db: Db, userId: string): PlaceSummary[] {
  const map = new Map<string, PlaceSummary>();
  const sectionName = new Map(db.sections.map((s) => [s.id, `${s.emoji} ${s.name}`]));
  for (const item of userItems(db, userId)) {
    for (const raw of item.analysis?.places ?? []) {
      const name = raw.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const p = map.get(key) ?? { name, count: 0, itemIds: [], sections: [], latest: item.savedAt };
      p.count++;
      p.itemIds.push(item.id);
      const sec = item.sectionId ? sectionName.get(item.sectionId) : undefined;
      if (sec && !p.sections.includes(sec)) p.sections.push(sec);
      if (item.savedAt > p.latest) p.latest = item.savedAt;
      map.set(key, p);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest));
}

export type CreatorSummary = { handle: string; count: number; itemIds: string[]; sections: string[]; latest: string };

export function creatorsOf(db: Db, userId: string): CreatorSummary[] {
  const map = new Map<string, CreatorSummary>();
  const sectionName = new Map(db.sections.map((s) => [s.id, `${s.emoji} ${s.name}`]));
  for (const item of userItems(db, userId)) {
    const handle = item.author?.replace(/^@/, "").trim();
    if (!handle) continue;
    const key = handle.toLowerCase();
    const c = map.get(key) ?? { handle, count: 0, itemIds: [], sections: [], latest: item.savedAt };
    c.count++;
    c.itemIds.push(item.id);
    const sec = item.sectionId ? sectionName.get(item.sectionId) : undefined;
    if (sec && !c.sections.includes(sec)) c.sections.push(sec);
    if (item.savedAt > c.latest) c.latest = item.savedAt;
    map.set(key, c);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest));
}

/** Saves per calendar month for the last `months` months, oldest first. */
export function monthlyCounts(items: Item[], months = 12): { month: string; label: string; count: number }[] {
  const out: { month: string; label: string; count: number }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = months - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    out.push({ month: key, label: m.toLocaleDateString("en-IN", { month: "short" }), count: 0 });
  }
  const idx = new Map(out.map((o, i) => [o.month, i]));
  for (const it of items) {
    const i = idx.get(it.savedAt.slice(0, 7));
    if (i !== undefined) out[i].count++;
  }
  return out;
}

/** Saves the user has never opened (or not in a long time), oldest first. */
export function forgotten(items: Item[], olderThanDays = 30): Item[] {
  const cutoff = new Date(Date.now() - olderThanDays * 86400_000).toISOString();
  return items.filter((i) => i.status === "ready" && i.savedAt < cutoff && (!i.lastViewedAt || i.lastViewedAt < cutoff)).sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}

/** Pick a few older saves to resurface; changes daily, stable within a day. */
export function rediscover<T extends { id: string; savedAt: string }>(items: T[], n: number): T[] {
  const cutoff = new Date(Date.now() - 45 * 86400_000).toISOString();
  const day = new Date().toISOString().slice(0, 10);
  const score = (id: string) => {
    let h = 0;
    for (const c of id + day) h = (h * 33 + c.charCodeAt(0)) >>> 0;
    return h;
  };
  return items.filter((i) => i.savedAt < cutoff).sort((a, b) => score(a.id) - score(b.id)).slice(0, n);
}

/** Action items from a save not yet on the try list. */
export function suggestedTodos(db: Db, userId: string, limit = 6): { itemId: string; text: string; title: string; emoji: string }[] {
  const have = new Set(db.todos.filter((t) => t.userId === userId).map((t) => `${t.itemId}|${t.text.toLowerCase()}`));
  const out: { itemId: string; text: string; title: string; emoji: string }[] = [];
  for (const item of userItems(db, userId)) {
    const s = db.sections.find((x) => x.id === item.sectionId);
    for (const a of item.analysis?.actionItems ?? []) {
      if (have.has(`${item.id}|${a.toLowerCase()}`)) continue;
      out.push({ itemId: item.id, text: a, title: item.analysis?.title ?? "", emoji: s?.emoji ?? "🗂️" });
      break; // one per save keeps suggestions varied
    }
    if (out.length >= limit) break;
  }
  return out;
}
