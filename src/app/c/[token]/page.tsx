import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, MapPin } from "lucide-react";
import { btn, chipStyle, Logo, tileStyle } from "@/components/ui";
import { readDb } from "@/lib/store";

async function load(token: string) {
  const db = await readDb();
  const c = db.collections.find((x) => x.shareToken === token);
  if (!c) return null;
  const owner = db.users.find((u) => u.id === c.userId);
  const byId = new Map(db.items.map((i) => [i.id, i]));
  const items = c.itemIds
    .map((id) => byId.get(id))
    .filter((i) => i && i.userId === c.userId && i.status === "ready")
    .map((i) => ({ item: i!, section: db.sections.find((s) => s.id === i!.sectionId) }));
  return { c, owner, items };
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const data = await load((await params).token);
  if (!data) return { title: "Collection not found" };
  return { title: `${data.c.emoji} ${data.c.name}`, description: data.c.description || `${data.items.length} saves curated on ReelMind` };
}

/** Public, read-only view of a shared collection. Shows titles and summaries only; never captions, notes or media. */
export default async function SharedCollection({ params }: { params: Promise<{ token: string }> }) {
  const data = await load((await params).token);
  if (!data) notFound();
  const { c, owner, items } = data;
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Logo />
          <Link href="/signup" className={btn.primary}>
            Make your own <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>
      <section className="hero-glow border-b border-line bg-white">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <span className="text-6xl">{c.emoji}</span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">{c.name}</h1>
          <p className="mt-2 text-lg text-muted">
            {c.description ? `${c.description} · ` : ""}
            {items.length} saves curated by {owner?.name.split(" ")[0] ?? "a ReelMind user"}
          </p>
        </div>
      </section>
      <main className="mx-auto grid max-w-5xl gap-4 px-5 py-10 sm:grid-cols-2">
        {items.map(({ item, section }) => {
          const a = item.analysis!;
          return (
            <article key={item.id} className="soft-shadow overflow-hidden rounded-2xl border border-line bg-white">
              <div className="flex items-center gap-3 p-5 pb-0">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={tileStyle(section?.slug ?? "x")}>
                  {section?.emoji ?? "🗂️"}
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold leading-snug">{a.title}</h2>
                  {section && (
                    <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium" style={chipStyle(section.slug)}>
                      {section.name}
                      {a.subtopic ? ` · ${a.subtopic}` : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-3 p-5">
                <p className="text-sm leading-relaxed text-ink/80">{a.summary}</p>
                {a.keyPoints.length > 0 && (
                  <ul className="ml-4 list-disc space-y-1 text-sm text-ink/75 marker:text-violet-400">
                    {a.keyPoints.slice(0, 4).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
                {a.places.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {a.places.slice(0, 5).map((p) => (
                      <a key={p} target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(p)}`} className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-0.5 text-xs hover:bg-violet-50">
                        <MapPin className="h-3 w-3 text-rose-500" /> {p}
                      </a>
                    ))}
                  </div>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                    View on Instagram{item.author ? ` · @${item.author}` : ""} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </main>
      <footer className="pb-12 text-center text-sm text-muted">
        Made with{" "}
        <Link href="/" className="font-medium text-brand">
          ReelMind
        </Link>
        , the second brain for Instagram saves.
      </footer>
    </div>
  );
}
