import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderTree } from "lucide-react";
import { Empty, PageHeader, tileStyle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { sectionSummaries } from "@/lib/library";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Sections" };

export default async function SectionsPage() {
  const user = await requireUser();
  const db = await readDb();
  const sections = sectionSummaries(db, user.id);
  const total = sections.reduce((n, s) => n + s.count, 0);
  return (
    <div className="rise">
      <PageHeader eyebrow="Library" title="Sections" subtitle="Areas of your life the AI created from what you save. Saves can be moved between sections any time." />
      {sections.length === 0 ? (
        <Empty icon={<FolderTree className="h-5 w-5" />} title="No sections yet">
          Sections appear as soon as your first saves are sorted.
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => {
            const subs = [...new Set(s.items.map((i) => i.analysis?.subtopic).filter(Boolean))].slice(0, 4);
            return (
              <Link key={s.id} href={`/app/sections/${s.slug}`} className="lift group relative overflow-hidden rounded-3xl border border-line p-6" style={tileStyle(s.slug)}>
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{s.emoji}</span>
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold">{Math.round((s.count / total) * 100)}%</span>
                </div>
                <h2 className="mt-6 text-lg font-semibold">{s.name}</h2>
                <p className="line-clamp-2 text-sm text-ink/60">{s.description}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {subs.map((t) => (
                    <span key={t} className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-4 flex items-center justify-between text-xs text-ink/60">
                  <span>
                    {s.count} saves · latest {s.latest ? timeAgo(s.latest) : ""}
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-70" />
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
