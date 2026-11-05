import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AskBar, PromptChips } from "@/components/ask-bar";
import { LibraryView } from "@/components/library-view";
import { tileStyle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { plural } from "@/lib/format";
import { userItems } from "@/lib/library";
import { readDb } from "@/lib/store";
import type { Intent } from "@/lib/types";
import { pickerOptions, toView } from "@/lib/view";

/** Suggested asks depend on what the section is mostly for. */
function promptsFor(name: string, intent: Intent | null): string[] {
  const n = name;
  const byIntent: Partial<Record<Intent, string[]>> = {
    visit: [`Plan a trip using my ${n} saves`, `List every place I saved in ${n}`, `Which of these fit a weekend getaway?`],
    cook: [`Make a weekly meal plan from my ${n} saves`, `Give me a shopping list for these recipes`, `What can I cook in 20 minutes?`],
    do: [`Build a weekly routine from my ${n} saves`, `Turn my ${n} saves into a checklist`, `Which of these should I start with?`],
    learn: [`Summarise the key lessons in ${n}`, `Quiz me on what I saved in ${n}`, `Turn ${n} into a study plan`],
    feel: [`What helps when I feel low, from my ${n} saves?`, `Give me 5 reminders from ${n}`, `Make a calm-down routine from these`],
    buy: [`Make a wishlist from my ${n} saves`, `Which products did I save in ${n}?`],
    watch: [`Make a watchlist from ${n}`],
  };
  return [...(intent ? byIntent[intent] ?? [] : []), `What's in ${n}? Give me the highlights`].slice(0, 4);
}

export const metadata: Metadata = { title: "Section" };

export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const db = await readDb();
  const section = db.sections.find((s) => s.userId === user.id && s.slug === slug);
  if (!section) notFound();
  const items = userItems(db, user.id).filter((i) => i.sectionId === section.id).map((i) => toView(db, i));

  const counts = new Map<Intent, number>();
  for (const i of items) if (i.intent) counts.set(i.intent, (counts.get(i.intent) ?? 0) + 1);
  const topIntent = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const places = [...new Set(items.flatMap((i) => i.places))].slice(0, 12);

  return (
    <div className="rise space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-line p-6 sm:p-10" style={tileStyle(section.slug)}>
        <span className="pointer-events-none absolute -right-6 -top-8 select-none text-[160px] opacity-20">{section.emoji}</span>
        <span className="text-5xl">{section.emoji}</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{section.name}</h1>
        <p className="mt-1 text-ink/70">{section.description} · {plural(items.length, "save")}</p>
        {places.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {places.map((p) => (
              <span key={p} className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium">📍 {p}</span>
            ))}
          </div>
        )}
        <div className="mt-6 max-w-2xl">
          <AskBar placeholder={`Ask about your ${section.name} saves…`} section={section.name} />
        </div>
        <div className="mt-3">
          <PromptChips prompts={promptsFor(section.name, topIntent)} />
        </div>
      </div>
      <LibraryView items={items} sections={[]} showSectionFilter={false} {...pickerOptions(db, user.id)} />
    </div>
  );
}
