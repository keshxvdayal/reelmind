import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, Eye, Ghost, ListChecks, MapPin, Sparkles, TrendingUp } from "lucide-react";
import { MonthBars, ShareBars } from "@/components/charts";
import { ItemRow } from "@/components/item-card";
import { Card, Empty, PageHeader, SectionTitle, Stat } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { creatorsOf, forgotten, monthlyCounts, placesOf } from "@/lib/insights";
import { sectionSummaries, userItems } from "@/lib/library";
import { readDb } from "@/lib/store";
import { INTENT_LABEL, type Intent } from "@/lib/types";
import { toView } from "@/lib/view";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const user = await requireUser();
  const db = await readDb();
  const items = userItems(db, user.id);
  if (!items.length)
    return (
      <div className="rise">
        <PageHeader eyebrow="Explore" title="Insights" />
        <Empty icon={<TrendingUp className="h-5 w-5" />} title="Nothing to show yet">
          Insights appear after your first few saves.
        </Empty>
      </div>
    );
  const months = monthlyCounts(items, 12);
  const thisMonth = months.at(-1)!.count;
  const lastMonth = months.at(-2)!.count;
  const sections = sectionSummaries(db, user.id);
  const intents = new Map<Intent, number>();
  for (const i of items) if (i.analysis?.intent) intents.set(i.analysis.intent, (intents.get(i.analysis.intent) ?? 0) + 1);
  const opened = items.filter((i) => i.viewCount).length;
  const todos = db.todos.filter((t) => t.userId === user.id);
  const lost = forgotten(items, 30);
  const creators = creatorsOf(db, user.id).slice(0, 5);
  const places = placesOf(db, user.id);
  const plans = db.plans.filter((p) => p.userId === user.id).length;
  const trend = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  return (
    <div className="rise space-y-8">
      <PageHeader eyebrow="Explore" title="Insights" subtitle="What you save, what you use, and what you've forgotten." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total saves" value={items.length} hint={`${sections.length} sections`} icon={<Sparkles className="h-4 w-4" />} />
        <Stat label="This month" value={thisMonth} hint={trend === null ? "first month" : `${trend >= 0 ? "+" : ""}${trend}% vs last month`} icon={<TrendingUp className="h-4 w-4" />} />
        <Stat label="Opened again" value={`${Math.round((opened / items.length) * 100)}%`} hint={`${opened} of ${items.length} saves`} icon={<Eye className="h-4 w-4" />} />
        <Stat label="Turned into action" value={todos.filter((t) => t.done).length} hint={`tried · ${plans} plans made`} icon={<ListChecks className="h-4 w-4" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <SectionTitle title="Saves per month" hint="last 12 months" />
          <MonthBars data={months} />
        </Card>
        <Card className="p-6">
          <SectionTitle title="Top sections" />
          <ShareBars rows={sections.slice(0, 7).map((s) => ({ label: `${s.emoji} ${s.name}`, value: s.count }))} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <SectionTitle title="Why you save" />
          <ShareBars rows={[...intents].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: INTENT_LABEL[k], value: v }))} />
        </Card>
        <Card className="p-6">
          <SectionTitle title="Favourite creators" action={<Link href="/app/creators" className="text-xs font-medium text-brand">All</Link>} />
          {creators.length ? <ShareBars rows={creators.map((c) => ({ label: `@${c.handle}`, value: c.count }))} /> : <p className="text-sm text-muted">No creator info yet.</p>}
        </Card>
        <Card className="p-6">
          <SectionTitle icon={<MapPin className="h-4 w-4" />} title="Places" action={<Link href="/app/places" className="text-xs font-medium text-brand">All</Link>} />
          <p className="text-3xl font-semibold tracking-tight">{places.length}</p>
          <p className="mb-4 text-sm text-muted">places across your saves</p>
          <div className="flex flex-wrap gap-1.5">
            {places.slice(0, 10).map((p) => (
              <span key={p.name} className="rounded-full bg-canvas px-2.5 py-1 text-xs ring-1 ring-line">
                📍 {p.name}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <SectionTitle
          icon={<Ghost className="h-4 w-4" />}
          title="Saved and forgotten"
          hint={`${lost.length} saves older than a month that you never opened`}
          action={
            <Link href="/app/planner" className="inline-flex items-center gap-1 text-xs font-medium text-brand">
              <CalendarRange className="h-3.5 w-3.5" /> Turn them into a plan
            </Link>
          }
        />
        {lost.length ? (
          <div className="grid gap-x-4 md:grid-cols-2">
            {lost.slice(0, 10).map((i) => (
              <ItemRow key={i.id} item={toView(db, i)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Nothing forgotten. Impressive!</p>
        )}
      </Card>
    </div>
  );
}
