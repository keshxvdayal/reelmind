import type { Metadata } from "next";
import Link from "next/link";
import { FolderHeart, Globe } from "lucide-react";
import { NewCollectionButton } from "@/components/collection-forms";
import { Empty, PageHeader, tileStyle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const user = await requireUser();
  const db = await readDb();
  const cols = db.collections.filter((c) => c.userId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const items = new Map(db.items.map((i) => [i.id, i]));
  const sections = new Map(db.sections.map((s) => [s.id, s]));
  const limit = PLANS[user.plan].collectionLimit;
  return (
    <div className="rise">
      <PageHeader
        eyebrow="Library"
        title="Collections"
        subtitle={`Hand-picked boards for trips, events and projects. Share any of them with a link.${limit ? ` Free plan: ${cols.length} of ${limit} used.` : ""}`}
        action={<NewCollectionButton />}
      />
      {cols.length === 0 ? (
        <Empty icon={<FolderHeart className="h-5 w-5" />} title="No collections yet" action={<NewCollectionButton label="Create your first" />}>
          Try “Goa trip, December”, “Wedding ideas” or “Recipes to cook this month”.
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cols.map((c) => {
            const covers = c.itemIds.slice(0, 4).map((id) => items.get(id)).filter(Boolean);
            return (
              <Link key={c.id} href={`/app/collections/${c.id}`} className="lift group overflow-hidden rounded-3xl border border-line bg-white">
                <div className="grid aspect-[16/9] grid-cols-2 grid-rows-2 gap-0.5 bg-line">
                  {[0, 1, 2, 3].map((n) => {
                    const it = covers[n];
                    const sec = it?.sectionId ? sections.get(it.sectionId) : undefined;
                    return (
                      <div key={n} className="grid place-items-center overflow-hidden text-2xl" style={tileStyle(sec?.slug ?? `${c.id}${n}`)}>
                        {it?.hasMedia ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/media/${it.id}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (sec?.emoji ?? (n === 0 ? c.emoji : ""))
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.emoji}</span>
                    <h2 className="flex-1 truncate font-semibold">{c.name}</h2>
                    {c.shareToken && <Globe className="h-4 w-4 text-emerald-500" />}
                  </div>
                  {c.description && <p className="mt-1 line-clamp-1 text-sm text-muted">{c.description}</p>}
                  <p className="mt-2 text-xs text-muted">
                    {c.itemIds.length} saves · updated {timeAgo(c.updatedAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
