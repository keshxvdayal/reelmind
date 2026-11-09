import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, Clock, Crown, MapPin, Newspaper, ShoppingBag, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { ShareBars } from "@/components/charts";
import { ItemCard } from "@/components/item-card";
import { Card, Empty, Locked, PageHeader, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { weeklyDigest, type Digest } from "@/lib/digest";
import { LOCALE } from "@/lib/format";
import { getTimeZone } from "@/lib/locale";
import { can } from "@/lib/plans";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Weekly digest" };

export default async function DigestPage() {
  const user = await requireUser();
  const db = await readDb();
  const tz = await getTimeZone();
  const d = weeklyDigest(db, user.id);
  const unlocked = can(user, "digest");
  const range = (iso: string) => new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "short", timeZone: tz });

  return (
    <div className="rise space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-amber-600">
            <Crown className="h-3.5 w-3.5" /> Premium
          </span>
        }
        title="Your weekly digest"
        subtitle={`${range(d.from)} – ${range(d.to)} · everything you saved, summed up.`}
      />
      {unlocked ? (
        <DigestBody d={d} tz={tz} />
      ) : (
        <Locked plan="premium" title="Your week, summed up" body="Premium turns each week of saves into a digest: highlights, new places, what's coming up and what to revisit.">
          <DigestBody d={d} tz={tz} />
        </Locked>
      )}
    </div>
  );
}

function DigestBody({ d, tz }: { d: Digest; tz: string }) {
  const delta = d.previousCount ? Math.round(((d.saves.length - d.previousCount) / d.previousCount) * 100) : null;
  const when = (iso: string) => new Date(iso).toLocaleString(LOCALE, { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: tz });

  return (
    <div className="space-y-6">
      <section className="premium-card relative overflow-hidden rounded-3xl p-7 sm:p-9">
        <div className="grid-bg absolute inset-0 opacity-25" />
        <div className="relative">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
            <Newspaper className="h-4 w-4" /> This week in your second brain
          </p>
          <p className="mt-4 max-w-3xl font-display text-[28px] leading-tight sm:text-[36px]">{d.headline}</p>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "New saves", value: d.saves.length, hint: delta === null ? "first week" : `${delta >= 0 ? "+" : ""}${delta}% vs last week`, icon: delta !== null && delta < 0 ? TrendingDown : TrendingUp },
              { label: "New places", value: d.places.length, hint: d.places[0] ?? "none yet", icon: MapPin },
              { label: "Tried this week", value: d.todosDone, hint: `${d.todosOpen.length} still open`, icon: CheckCircle2 },
              { label: "Coming up", value: d.upcoming.length, hint: "reminders next 7 days", icon: Bell },
            ].map(({ label, value, hint, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="flex items-center justify-between text-xs text-white/55">
                  {label} <Icon className="h-3.5 w-3.5 text-amber-300" />
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
                <p className="truncate text-xs text-white/50">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {d.saves.length === 0 ? (
        <Empty icon={<Sparkles className="h-5 w-5" />} title="No new saves this week">
          Share a reel with the bot and it&apos;ll show up in next week&apos;s digest. Meanwhile, here&apos;s something from your archive.
        </Empty>
      ) : (
        <>
          <section>
            <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="Highlights" hint="The most useful things you saved" />
            <div className="grid gap-4 lg:grid-cols-3">
              {d.highlights.map(({ item, points }) => (
                <Link key={item.id} href={`/app/saves/${item.id}`} className="card-hover soft-shadow group flex flex-col rounded-2xl border border-line bg-white p-5">
                  <p className="text-xs font-medium text-muted">
                    {item.section?.emoji} {item.section?.name}
                  </p>
                  <p className="mt-1.5 font-semibold leading-snug">{item.title}</p>
                  {points.length > 0 ? (
                    <ul className="mt-3 flex-1 space-y-1.5">
                      {points.map((p) => (
                        <li key={p} className="flex gap-2 text-sm text-ink/75">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" /> <span className="line-clamp-2">{p}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{item.summary}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-6">
              <SectionTitle title="Where your attention went" />
              <ShareBars rows={d.sections.map((s) => ({ label: `${s.emoji} ${s.name}`, value: s.count, href: `/app/sections/${s.slug}` }))} />
            </Card>
            <Card className="p-6">
              <SectionTitle icon={<MapPin className="h-4 w-4" />} title="Added to your map" />
              {d.places.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {d.places.slice(0, 14).map((p) => (
                    <a key={p} href={`https://www.google.com/maps/search/${encodeURIComponent(p)}`} target="_blank" rel="noreferrer" className="rounded-full bg-canvas px-2.5 py-1 text-xs ring-1 ring-line transition hover:ring-violet-300">
                      📍 {p}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No places this week.</p>
              )}
              {d.products.length > 0 && (
                <>
                  <p className="mb-2 mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    <ShoppingBag className="h-3.5 w-3.5" /> Products mentioned
                  </p>
                  <p className="text-sm text-ink/75">{d.products.slice(0, 8).join(" · ")}</p>
                </>
              )}
            </Card>
            <Card className="p-6">
              <SectionTitle icon={<Bell className="h-4 w-4" />} title="Next 7 days" />
              {d.upcoming.length || d.todosOpen.length ? (
                <ul className="space-y-2">
                  {d.upcoming.map((r) => (
                    <li key={r.id}>
                      <Link href={`/app/saves/${r.itemId}`} className="flex items-center gap-3 rounded-xl bg-amber-50 px-3 py-2 text-sm hover:bg-amber-100">
                        <span className="shrink-0 text-xs font-semibold text-amber-700">{when(r.dueAt)}</span>
                        <span className="truncate">{r.title}</span>
                      </Link>
                    </li>
                  ))}
                  {d.todosOpen.slice(0, 4).map((t) => (
                    <li key={t.id} className="flex items-center gap-2.5 px-1 text-sm">
                      <span className="h-4 w-4 shrink-0 rounded-full border-2 border-violet-300" />
                      <span className="truncate">{t.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Nothing scheduled. Open a save and tap “Remind me”.</p>
              )}
            </Card>
          </div>

          {d.creators.length > 0 && (
            <Card className="p-6">
              <SectionTitle title="Creators you saved from" />
              <div className="flex flex-wrap gap-2">
                {d.creators.map((c) => (
                  <a key={c.handle} href={`https://instagram.com/${c.handle}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm transition hover:border-violet-300">
                    <span className="brand-gradient grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white">{c.handle[0]?.toUpperCase()}</span>@{c.handle}
                    <span className="text-xs text-muted">×{c.count}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {d.rediscover.length > 0 && (
        <section>
          <SectionTitle icon={<Clock className="h-4 w-4" />} title="Worth revisiting" hint="From further back in your library" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {d.rediscover.map((m) => (
              <ItemCard key={m.id} item={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
