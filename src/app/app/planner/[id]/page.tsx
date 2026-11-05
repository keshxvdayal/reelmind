import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Answer } from "@/components/answer";
import { PlanActions } from "@/components/plan-actions";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { buildCatalog } from "@/lib/catalog";
import { fmtDate } from "@/lib/format";
import { TEMPLATES } from "@/lib/planner";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await readDb();
  const plan = db.plans.find((p) => p.id === id && p.userId === user.id);
  if (!plan) notFound();
  const catalog = buildCatalog(db, user.id);
  const t = TEMPLATES[plan.template];
  const sources = plan.itemIds.map((x) => catalog[x]).filter(Boolean);
  return (
    <div className="rise space-y-6">
      <Link href="/app/planner" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink print:hidden">
        <ArrowLeft className="h-4 w-4" /> Planner
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                {t.emoji} {t.title}
              </p>
              <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">{plan.title}</h1>
              <p className="mt-1 text-sm text-muted">
                “{plan.request}” · {fmtDate(plan.createdAt)}
              </p>
            </div>
            <PlanActions id={plan.id} text={plan.text} />
          </div>
          <Card className="p-6 sm:p-8">
            <Answer text={plan.text} catalog={catalog} />
          </Card>
        </div>
        <aside className="print:hidden">
          <Card className="p-5">
            <p className="mb-3 text-sm font-semibold">Built from {sources.length} saves</p>
            <div className="space-y-1.5">
              {sources.map((s) => (
                <Link key={s.id} href={`/app/saves/${s.id}`} className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-canvas">
                  <span className="text-lg">{s.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[13px] font-medium leading-snug">{s.title}</span>
                    <span className="text-[11px] text-muted">{s.section}</span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                </Link>
              ))}
              {sources.length === 0 && <p className="text-sm text-muted">No specific saves were cited.</p>}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
