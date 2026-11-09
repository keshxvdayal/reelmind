import { rediscover } from "@/lib/insights";
import { userItems } from "@/lib/library";
import type { Db, Item } from "@/lib/types";
import { toView, type ItemView } from "@/lib/view";

const DAY = 86400_000;

export type Digest = {
  from: string;
  to: string;
  saves: ItemView[];
  previousCount: number;
  sections: { name: string; emoji: string; slug: string; count: number }[];
  places: string[];
  products: string[];
  creators: { handle: string; count: number }[];
  highlights: { item: ItemView; points: string[] }[];
  todosDone: number;
  todosOpen: { id: string; text: string }[];
  upcoming: { id: string; dueAt: string; title: string; itemId: string }[];
  rediscover: ItemView[];
  headline: string;
};

const uniq = (xs: string[]) => [...new Map(xs.map((x) => [x.trim().toLowerCase(), x.trim()])).values()].filter(Boolean);

/** A one-line summary of the week, written from the numbers (no AI call, so it's instant and free). */
function headlineFor(saves: Item[], sections: Digest["sections"], prev: number, places: string[]): string {
  if (!saves.length) return "A quiet week. Here's something from your archive instead.";
  const top = sections[0];
  const parts = [`You saved ${saves.length} thing${saves.length === 1 ? "" : "s"} this week`];
  if (top) parts.push(`mostly ${top.emoji} ${top.name}`);
  let s = parts.join(", ");
  if (prev) {
    const d = Math.round(((saves.length - prev) / prev) * 100);
    if (Math.abs(d) >= 10) s += ` (${d > 0 ? "up" : "down"} ${Math.abs(d)}% on last week)`;
  }
  s += ".";
  if (places.length) s += ` ${places.length} new place${places.length === 1 ? "" : "s"} on your map.`;
  return s;
}

/** The last 7 days of a user's library, summarised. */
export function weeklyDigest(db: Db, userId: string, now = Date.now()): Digest {
  const to = new Date(now).toISOString();
  const from = new Date(now - 7 * DAY).toISOString();
  const prevFrom = new Date(now - 14 * DAY).toISOString();
  const all = userItems(db, userId).filter((i) => i.status === "ready");
  const week = all.filter((i) => i.savedAt >= from);
  const previousCount = all.filter((i) => i.savedAt >= prevFrom && i.savedAt < from).length;

  const secCount = new Map<string, number>();
  for (const i of week) if (i.sectionId) secCount.set(i.sectionId, (secCount.get(i.sectionId) ?? 0) + 1);
  const sections = [...secCount]
    .map(([id, count]) => {
      const s = db.sections.find((x) => x.id === id);
      return s ? { name: s.name, emoji: s.emoji, slug: s.slug, count } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.count - a.count);

  const places = uniq(week.flatMap((i) => i.analysis?.places ?? []));
  const products = uniq(week.flatMap((i) => i.analysis?.products ?? []));
  const creatorMap = new Map<string, number>();
  for (const i of week) {
    const h = i.author?.replace(/^@/, "");
    if (h) creatorMap.set(h, (creatorMap.get(h) ?? 0) + 1);
  }
  const creators = [...creatorMap].map(([handle, count]) => ({ handle, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Highlights: favourites first, then the saves with the most concrete content.
  const highlights = [...week]
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || (b.analysis?.keyPoints.length ?? 0) - (a.analysis?.keyPoints.length ?? 0))
    .slice(0, 3)
    .map((i) => ({ item: toView(db, i), points: (i.analysis?.keyPoints ?? []).slice(0, 3) }));

  const todos = db.todos.filter((t) => t.userId === userId);
  const nextWeek = new Date(now + 7 * DAY).toISOString();
  const upcoming = db.reminders
    .filter((r) => r.userId === userId && !r.doneAt && r.dueAt >= to && r.dueAt <= nextWeek)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 5)
    .map((r) => {
      const item = db.items.find((i) => i.id === r.itemId);
      return { id: r.id, dueAt: r.dueAt, title: item?.analysis?.title ?? "A save", itemId: r.itemId };
    });

  return {
    from,
    to,
    saves: week.map((i) => toView(db, i)),
    previousCount,
    sections,
    places,
    products,
    creators,
    highlights,
    todosDone: todos.filter((t) => t.done && t.doneAt && t.doneAt >= from).length,
    todosOpen: todos.filter((t) => !t.done).slice(0, 5).map(({ id, text }) => ({ id, text })),
    upcoming,
    rediscover: rediscover(all.map((i) => toView(db, i)), 3),
    headline: headlineFor(week, sections, previousCount, places),
  };
}
