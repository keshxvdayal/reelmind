import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Planner } from "@/components/planner";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { aiEnabled } from "@/lib/ai/client";
import { requireUser } from "@/lib/auth";
import { buildCatalog } from "@/lib/catalog";
import { timeAgo } from "@/lib/format";
import { TEMPLATES } from "@/lib/planner";
import { PLANS, plansThisMonth } from "@/lib/plans";
import { readDb } from "@/lib/store";
import type { PlanTemplate } from "@/lib/types";

export const metadata: Metadata = { title: "Planner" };

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ collection?: string }> }) {
  const user = await requireUser();
  const { collection } = await searchParams;
  const db = await readDb();
  const plans = db.plans.filter((p) => p.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const collections = db.collections.filter((c) => c.userId === user.id).map(({ id, name, emoji }) => ({ id, name, emoji }));
  const limit = PLANS[user.plan].plansPerMonth;
  return (
    <div className="rise space-y-10">
      <PageHeader eyebrow="AI planner" title="Turn saves into a plan" subtitle="Pick a template, say what you want, and ReelMind builds it from the reels you saved, linking every step back to its source." />
      <Planner
        templates={Object.entries(TEMPLATES) as [PlanTemplate, (typeof TEMPLATES)[PlanTemplate]][]}
        collections={collections}
        initialCollection={collections.some((c) => c.id === collection) ? collection! : null}
        catalog={buildCatalog(db, user.id)}
        aiReady={aiEnabled()}
        remaining={limit === null ? null : Math.max(0, limit - plansThisMonth(db, user.id))}
      />
      <section>
        <SectionTitle icon={<CalendarRange className="h-4 w-4" />} title="Your plans" hint={plans.length ? `${plans.length} saved` : undefined} />
        {plans.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">Plans you make are kept here.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <Link key={p.id} href={`/app/planner/${p.id}`}>
                <Card className="lift h-full p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-xl">{TEMPLATES[p.template].emoji}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.title}</p>
                      <p className="text-xs text-muted">
                        {TEMPLATES[p.template].title} · {timeAgo(p.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted">{p.request}</p>
                  <p className="mt-3 text-xs text-muted">{p.itemIds.length} saves used</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
