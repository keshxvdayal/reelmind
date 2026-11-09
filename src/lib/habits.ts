import type { Item, Todo } from "@/lib/types";

const DAY = 86400_000;

/** Calendar date (YYYY-MM-DD) of an instant in a time zone. */
export function dayKey(iso: string | Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

const shiftKey = (key: string, days: number) => new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

export type HeatCell = { date: string; count: number; future: boolean };

/**
 * Saves per day for the last `weeks` weeks, as columns of 7 days (Mon→Sun),
 * like a contribution graph. The last column ends on this week's Sunday.
 */
export function heatmap(items: Item[], timeZone: string, weeks = 26): HeatCell[][] {
  const counts = new Map<string, number>();
  for (const i of items) {
    const k = dayKey(i.savedAt, timeZone);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const today = dayKey(new Date(), timeZone);
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
  const start = shiftKey(today, -dow - (weeks - 1) * 7);
  const cols: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = shiftKey(start, w * 7 + d);
      col.push({ date, count: counts.get(date) ?? 0, future: date > today });
    }
    cols.push(col);
  }
  return cols;
}

/** Current and longest runs of consecutive days with at least one save. Today without a save doesn't break the current run yet. */
export function streaks(items: Item[], timeZone: string): { current: number; longest: number } {
  const days = new Set(items.map((i) => dayKey(i.savedAt, timeZone)));
  const today = dayKey(new Date(), timeZone);
  let current = 0;
  let d = days.has(today) ? today : shiftKey(today, -1);
  while (days.has(d)) {
    current++;
    d = shiftKey(d, -1);
  }
  let longest = 0;
  for (const day of days) {
    if (days.has(shiftKey(day, -1))) continue; // not the start of a run
    let n = 1;
    while (days.has(shiftKey(day, n))) n++;
    longest = Math.max(longest, n);
  }
  return { current, longest };
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Saves by weekday (Mon→Sun) and by part of day, in the user's time zone. */
export function rhythm(items: Item[], timeZone: string) {
  const byDay = WEEKDAYS.map((label) => ({ label: label.slice(0, 3), count: 0 }));
  const parts = [
    { label: "Morning", hint: "5am–12pm", count: 0 },
    { label: "Afternoon", hint: "12–5pm", count: 0 },
    { label: "Evening", hint: "5–10pm", count: 0 },
    { label: "Late night", hint: "10pm–5am", count: 0 },
  ];
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", hour12: false });
  for (const i of items) {
    const p = fmt.formatToParts(new Date(i.savedAt));
    const wd = p.find((x) => x.type === "weekday")?.value ?? "Mon";
    const h = Number(p.find((x) => x.type === "hour")?.value ?? 0) % 24;
    const idx = byDay.findIndex((d) => d.label === wd);
    if (idx >= 0) byDay[idx].count++;
    parts[h >= 5 && h < 12 ? 0 : h >= 12 && h < 17 ? 1 : h >= 17 && h < 22 ? 2 : 3].count++;
  }
  const top = byDay.reduce((a, b) => (b.count > a.count ? b : a), byDay[0]);
  const topDay = WEEKDAYS[byDay.indexOf(top)];
  const topPart = parts.reduce((a, b) => (b.count > a.count ? b : a), parts[0]);
  return { byDay, parts, topDay, topPart: topPart.label };
}

/** Share of try-list items ticked off, and how many were done in the last 30 days. */
export function followThrough(todos: Todo[]) {
  const done = todos.filter((t) => t.done);
  const recent = done.filter((t) => t.doneAt && Date.now() - new Date(t.doneAt).getTime() < 30 * DAY).length;
  return { total: todos.length, done: done.length, rate: todos.length ? Math.round((done.length / todos.length) * 100) : 0, recent };
}
