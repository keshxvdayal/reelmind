import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange, FolderHeart } from "lucide-react";
import { AskBar } from "@/components/ask-bar";
import { CollectionToolbar, RemoveFromCollection } from "@/components/collection-forms";
import { ItemCard } from "@/components/item-card";
import { btn, Empty } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { plural, timeAgo } from "@/lib/format";
import { appUrl } from "@/lib/ingest";
import { userItems } from "@/lib/library";
import { readDb } from "@/lib/store";
import { toView } from "@/lib/view";

export const metadata: Metadata = { title: "Collection" };

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await readDb();
  const c = db.collections.find((x) => x.id === id && x.userId === user.id);
  if (!c) notFound();
  const byId = new Map(db.items.map((i) => [i.id, i]));
  const items = c.itemIds.map((x) => byId.get(x)).filter((i) => i && i.userId === user.id).map((i) => toView(db, i!));
  const candidates = userItems(db, user.id).map((i) => {
    const v = toView(db, i);
    return { id: v.id, title: v.title, emoji: v.section?.emoji ?? "🗂️", section: v.section?.name ?? "" };
  });
  const shareUrl = c.shareToken ? `${appUrl()}/c/${c.shareToken}` : null;

  return (
    <div className="rise space-y-7">
      <Link href="/app/collections" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Collections
      </Link>
      <div className="hero-glow relative overflow-hidden rounded-3xl border border-line bg-white p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <span className="text-5xl">{c.emoji}</span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{c.name}</h1>
            <p className="mt-1 text-muted">
              {c.description ? `${c.description} · ` : ""}
              {plural(items.length, "save")} · updated {timeAgo(c.updatedAt)}
            </p>
            {shareUrl && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                Shared publicly · <span className="font-mono">{shareUrl.replace(/^https?:\/\//, "")}</span>
              </p>
            )}
          </div>
          <CollectionToolbar collection={{ id: c.id, name: c.name, emoji: c.emoji, description: c.description, shared: Boolean(c.shareToken), itemIds: c.itemIds }} shareUrl={shareUrl} candidates={candidates} />
        </div>
        {items.length > 0 && (
          <div className="mt-7 grid gap-3 lg:grid-cols-[1fr_auto]">
            <AskBar placeholder={`Ask about “${c.name}”…`} collection={c.name} />
            <Link href={`/app/planner?collection=${c.id}`} className={`${btn.primary} py-3`}>
              <CalendarRange className="h-4 w-4" /> Make a plan from this
            </Link>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <Empty icon={<FolderHeart className="h-5 w-5" />} title="This collection is empty">
          Use “Add saves” above, or select saves in the library and choose “Add to collection”.
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((i) => (
            <div key={i.id} className="group/card relative flex">
              <RemoveFromCollection collectionId={c.id} itemId={i.id} />
              <div className="flex flex-1 [&>*]:flex-1">
                <ItemCard item={i} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
