import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, LoaderCircle, MapPin, Sparkles } from "lucide-react";
import { PromptChips } from "@/components/ask-bar";
import { ItemRow } from "@/components/item-card";
import { ItemActions } from "@/components/item-actions";
import { AddToTryList, CollectionPicker, RemindMe, ViewTracker } from "@/components/save-tools";
import { Card, chipStyle, tileStyle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate, timeAgo } from "@/lib/format";
import { tokens, userItems } from "@/lib/library";
import { readDb } from "@/lib/store";
import { INTENT_LABEL, type Db, type Item } from "@/lib/types";
import { toView } from "@/lib/view";

/** Saves that share a subtopic, place or tags with this one. */
function related(db: Db, item: Item, n = 5): Item[] {
  const a = item.analysis;
  if (!a) return [];
  const mine = new Set([...a.tags, ...a.places, a.subtopic].flatMap((t) => tokens(t)));
  return userItems(db, item.userId!)
    .filter((i) => i.id !== item.id && i.analysis)
    .map((i) => {
      const b = i.analysis!;
      let score = i.sectionId === item.sectionId ? 1 : 0;
      for (const t of [...b.tags, ...b.places, b.subtopic].flatMap((x) => tokens(x))) if (mine.has(t)) score += 2;
      return { i, score };
    })
    .filter((x) => x.score > 2)
    .sort((x, y) => y.score - x.score)
    .slice(0, n)
    .map((x) => x.i);
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink/80">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SavePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await readDb();
  const item = db.items.find((i) => i.id === id && i.userId === user.id);
  if (!item) notFound();
  const section = db.sections.find((s) => s.id === item.sectionId);
  const a = item.analysis;
  const sections = db.sections.filter((s) => s.userId === user.id).map(({ id, name, emoji }) => ({ id, name, emoji }));
  const collections = db.collections.filter((c) => c.userId === user.id).map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, has: c.itemIds.includes(item.id) }));
  const upcoming = db.reminders.filter((r) => r.itemId === item.id && r.userId === user.id && !r.doneAt).sort((x, y) => x.dueAt.localeCompare(y.dueAt))[0]?.dueAt ?? null;
  const onList = db.todos.filter((t) => t.userId === user.id && t.itemId === item.id).length;
  const similar = related(db, item);
  const entities = [...(a?.people ?? []).map((p) => `👤 ${p}`), ...(a?.products ?? []).map((p) => `🏷️ ${p}`)];

  return (
    <div className="rise space-y-6">
      <ViewTracker id={item.id} />
      <Link href={section ? `/app/sections/${section.slug}` : "/app/library"} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {section ? `${section.emoji} ${section.name}` : "All saves"}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              {section && <span className="rounded-full px-2.5 py-0.5 font-medium" style={chipStyle(section.slug)}>{section.emoji} {section.name}</span>}
              {a?.subtopic && <span className="rounded-full bg-white px-2.5 py-0.5 font-medium ring-1 ring-line">{a.subtopic}</span>}
              {a?.intent && <span className="rounded-full bg-white px-2.5 py-0.5 font-medium ring-1 ring-line">{INTENT_LABEL[a.intent]}</span>}
              <span className="text-muted"><span className="capitalize">{item.kind}</span> · saved {fmtDate(item.savedAt)} ({timeAgo(item.savedAt)})</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.status === "pending" ? "Sorting this save…" : a?.title}</h1>
            {item.author && <p className="mt-1 text-sm text-muted">by @{item.author}</p>}
          </div>

          {item.status === "pending" ? (
            <Card className="flex items-center gap-3 p-5 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" /> The AI is reading this save. This takes a few seconds.
            </Card>
          ) : (
            <Card className="space-y-5 p-6">
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
                <p className="leading-relaxed">{a?.summary}</p>
              </div>
              <List title="Key points" items={a?.keyPoints ?? []} />
              <List title="Things to do with this" items={a?.actionItems ?? []} />
              <AddToTryList itemId={item.id} actions={a?.actionItems ?? []} added={onList} />
              {(a?.places.length ?? 0) > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Places</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {a!.places.map((p) => (
                      <a key={p} target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(p)}`} className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-sm hover:bg-violet-50">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" /> {p}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {entities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entities.map((e) => (
                    <span key={e} className="rounded-full bg-canvas px-2.5 py-1 text-sm">{e}</span>
                  ))}
                </div>
              )}
              {(a?.tags.length ?? 0) > 0 && <p className="text-xs text-muted">{a!.tags.map((t) => `#${t.replace(/\s+/g, "")}`).join("  ")}</p>}
              {item.analyzedBy === "keywords" && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Sorted by keywords only (AI was not available). Use Re-analyse once the API key is set.</p>
              )}
            </Card>
          )}

          {item.caption && (
            <Card className="p-6">
              <h3 className="mb-2 text-sm font-semibold">Original caption</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{item.caption}</p>
            </Card>
          )}

          {item.status === "ready" && (
            <div>
              <p className="mb-2 text-sm font-medium">Do something with it</p>
              <PromptChips prompts={[`Find saves similar to “${a?.title}”`, `Help me act on “${a?.title}”`]} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line" style={tileStyle(section?.slug ?? "x")}>
            {item.hasMedia ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/media/${item.id}`} alt="" className="w-full" />
            ) : (
              <div className="grid aspect-[4/5] place-items-center text-7xl">{section?.emoji ?? "🗂️"}</div>
            )}
          </div>
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-black">
              Open on Instagram <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Card className="space-y-5 p-5">
            <RemindMe itemId={item.id} upcoming={upcoming} />
            <CollectionPicker itemId={item.id} collections={collections} />
          </Card>
          {similar.length > 0 && (
            <Card className="p-3">
              <p className="px-3 pb-1 pt-2 text-sm font-semibold">Related saves</p>
              {similar.map((r) => (
                <ItemRow key={r.id} item={toView(db, r)} />
              ))}
            </Card>
          )}
          <Card className="p-5">
            <ItemActions id={item.id} favorite={item.favorite} note={item.note} sectionId={item.sectionId} sections={sections} />
          </Card>
        </div>
      </div>
    </div>
  );
}
