import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";
import { Card, Empty, PageHeader, tileStyle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { creatorsOf } from "@/lib/insights";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Creators" };

export default async function CreatorsPage() {
  const user = await requireUser();
  const db = await readDb();
  const creators = creatorsOf(db, user.id);
  const titles = new Map(db.items.map((i) => [i.id, i.analysis?.title ?? "Save"]));
  return (
    <div className="rise">
      <PageHeader eyebrow="Explore" title="Creators" subtitle="The accounts you save from most, and what you saved from each." />
      {creators.length === 0 ? (
        <Empty icon={<Users className="h-5 w-5" />} title="No creators yet">
          Creators appear when saves include who posted them.
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c, i) => (
            <Card key={c.handle} className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full text-lg font-semibold uppercase text-ink/70 ring-2 ring-white" style={tileStyle(c.handle)}>
                  {c.handle.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">@{c.handle}</p>
                  <p className="truncate text-xs text-muted">
                    {c.count} saves · last {timeAgo(c.latest)}
                  </p>
                </div>
                {i < 3 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">#{i + 1}</span>}
              </div>
              <p className="mt-3 truncate text-xs text-muted">{c.sections.join(" · ")}</p>
              <div className="mt-3 space-y-1 border-t border-line pt-3">
                {c.itemIds.slice(0, 3).map((id) => (
                  <Link key={id} href={`/app/saves/${id}`} className="block truncate rounded-lg px-2 py-1 text-sm hover:bg-canvas">
                    {titles.get(id)}
                  </Link>
                ))}
              </div>
              <a href={`https://www.instagram.com/${encodeURIComponent(c.handle)}/`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 px-2 text-xs font-medium text-brand">
                View profile <ExternalLink className="h-3 w-3" />
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
