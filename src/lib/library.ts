import { newId } from "@/lib/store";
import type { Db, Item, Section } from "@/lib/types";

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "misc"
  );
}

/** Normalise a section name so "Travel", "travel " and "Travels" land in one section. */
function sectionKey(name: string): string {
  return slugify(name).replace(/-and-/g, "-").replace(/s$/, "");
}

/** Find the user's section with this name, or create it. Mutates db. */
export function upsertSection(db: Db, userId: string, name: string, emoji: string, description: string): Section {
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 40) || "Everything else";
  const key = sectionKey(clean);
  const existing = db.sections.find((s) => s.userId === userId && sectionKey(s.name) === key);
  if (existing) return existing;
  let slug = slugify(clean);
  const taken = new Set(db.sections.filter((s) => s.userId === userId).map((s) => s.slug));
  for (let i = 2; taken.has(slug); i++) slug = `${slugify(clean)}-${i}`;
  const section: Section = {
    id: newId(),
    userId,
    slug,
    name: clean,
    emoji: [...emoji.trim()].slice(0, 2).join("") || "📁",
    description: description.trim().slice(0, 160),
    createdAt: new Date().toISOString(),
  };
  db.sections.push(section);
  return section;
}

export function userItems(db: Db, userId: string): Item[] {
  return db.items
    .filter((i) => i.userId === userId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export type SectionSummary = Section & { count: number; latest: string | null; items: Item[] };

export function sectionSummaries(db: Db, userId: string): SectionSummary[] {
  const items = userItems(db, userId);
  return db.sections
    .filter((s) => s.userId === userId)
    .map((s) => {
      const mine = items.filter((i) => i.sectionId === s.id);
      return { ...s, count: mine.length, latest: mine[0]?.savedAt ?? null, items: mine };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count || (b.latest ?? "").localeCompare(a.latest ?? ""));
}

/** Drop sections that no longer hold any item. Mutates db. */
export function pruneEmptySections(db: Db, userId: string) {
  const used = new Set(db.items.filter((i) => i.userId === userId).map((i) => i.sectionId));
  db.sections = db.sections.filter((s) => s.userId !== userId || used.has(s.id));
}

/* ------------------------------------------------------------------ *
 * Search: weighted keyword match over everything the AI extracted.    *
 * The ask-agent calls this as a tool, several times with different    *
 * wordings, so plain keyword scoring with light stemming is enough.   *
 * ------------------------------------------------------------------ */
const STOP = new Set(
  "a an the and or of to in on for with about from my me i is are was were that this it at by be as what which some any all".split(" "),
);

/** Light stemming so "cafes"/"cafe", "flights"/"flight", "workouts"/"workout" match. */
function stem(w: string): string {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) return w.slice(0, -1);
  return w;
}

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s#@]/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[#@]/, ""))
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem);
}

function fieldsOf(item: Item, section: Section | undefined): [string, number][] {
  const a = item.analysis;
  return [
    [a?.title ?? "", 5],
    [section?.name ?? "", 4],
    [a?.subtopic ?? "", 4],
    [(a?.tags ?? []).join(" "), 4],
    [[...(a?.places ?? []), ...(a?.people ?? []), ...(a?.products ?? [])].join(" "), 4],
    [a?.summary ?? "", 2],
    [item.note, 3],
    [[...(a?.keyPoints ?? []), ...(a?.actionItems ?? [])].join(" "), 1],
    [item.caption, 1],
    [item.author ?? "", 2],
  ];
}

export type SearchFilters = {
  query?: string;
  sectionSlug?: string;
  intent?: string;
  after?: string; // ISO date, inclusive
  before?: string; // ISO date, inclusive
  favoritesOnly?: boolean;
  /** Collection id or name. */
  collection?: string;
  limit?: number;
};

export function searchItems(db: Db, userId: string, f: SearchFilters): { item: Item; score: number }[] {
  const sectionsById = new Map(db.sections.filter((s) => s.userId === userId).map((s) => [s.id, s]));
  const section = f.sectionSlug ? [...sectionsById.values()].find((s) => s.slug === f.sectionSlug || s.name.toLowerCase() === f.sectionSlug?.toLowerCase()) : undefined;
  const q = tokens(f.query ?? "");
  const before = f.before && f.before.length === 10 ? `${f.before}T23:59:59.999Z` : f.before;
  const coll = f.collection
    ? db.collections.find((c) => c.userId === userId && (c.id === f.collection || c.name.toLowerCase() === f.collection?.toLowerCase()))
    : undefined;
  const inColl = coll ? new Set(coll.itemIds) : null;

  const results: { item: Item; score: number }[] = [];
  for (const item of userItems(db, userId)) {
    if (f.sectionSlug && item.sectionId !== section?.id) continue;
    if (f.intent && item.analysis?.intent !== f.intent) continue;
    if (f.after && item.savedAt < f.after) continue;
    if (before && item.savedAt > before) continue;
    if (f.favoritesOnly && !item.favorite) continue;
    if (f.collection && !inColl?.has(item.id)) continue;

    let score = 0;
    if (q.length) {
      const fields = fieldsOf(item, item.sectionId ? sectionsById.get(item.sectionId) : undefined).map(
        ([text, w]) => [new Set(tokens(text)), w] as const,
      );
      let matched = 0;
      for (const term of q) {
        let best = 0;
        for (const [set, w] of fields) {
          if (set.has(term)) best = Math.max(best, w);
          else if (term.length >= 4) for (const t of set) if (t.startsWith(term) || (term.startsWith(t) && t.length >= 4)) { best = Math.max(best, w / 2); break; }
        }
        if (best) matched++;
        score += best;
      }
      if (!matched) continue;
      score *= matched / q.length; // reward matching more of the query
    }
    results.push({ item, score });
  }
  if (q.length) results.sort((a, b) => b.score - a.score || b.item.savedAt.localeCompare(a.item.savedAt));
  return results.slice(0, f.limit ?? 50);
}
