import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CalendarRange, Check, Clock, ListChecks, Send, Sparkles } from "lucide-react";
import { AddSave } from "@/components/add-save";
import { AskBar, PromptChips } from "@/components/ask-bar";
import { ItemCard, ItemGrid } from "@/components/item-card";
import { btn, Card, SectionTitle, tileStyle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { daysAgoIso, timeAgo } from "@/lib/format";
import { rediscover } from "@/lib/insights";
import { sectionSummaries, userItems } from "@/lib/library";
import { TEMPLATES } from "@/lib/planner";
import { prefsOf } from "@/lib/plans";
import { readDb } from "@/lib/store";
import { toView } from "@/lib/view";

export const metadata: Metadata = { title: "Home" };

function greeting() {
  const h = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  return h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function Home() {
  const user = await requireUser();
  const db = await readDb();
  const items = userItems(db, user.id);
  const views = items.map((i) => toView(db, i));
  const sections = sectionSummaries(db, user.id);
  const monthAgo = daysAgoIso(30);
  const thisMonth = items.filter((i) => i.savedAt >= monthAgo).length;
  const firstName = user.name.split(" ")[0];
  const now = new Date().toISOString();
  const dueReminders = db.reminders.filter((r) => r.userId === user.id && !r.doneAt && r.dueAt <= now);
  const openTodos = db.todos.filter((t) => t.userId === user.id && !t.done);
  const steps = [
    { done: Boolean(user.igUserId), label: "Connect Instagram", href: "/app/connect" },
    { done: items.length > 0, label: "Send your first reel", href: "/app/connect" },
    { done: db.chats.some((c) => c.userId === user.id), label: "Ask a question", href: "/app/ask" },
    { done: db.collections.some((c) => c.userId === user.id), label: "Make a collection", href: "/app/collections" },
    { done: db.plans.some((p) => p.userId === user.id), label: "Create an AI plan", href: "/app/planner" },
  ];
  const doneSteps = steps.filter((s) => s.done).length;
  const memories = prefsOf(user).rediscover ? rediscover(views.filter((v) => v.status === "ready"), 4) : [];
  const topSections = sections.slice(0, 3).map((s) => s.name);

  return (
    <div className="space-y-10">
      <section className="rise relative overflow-hidden rounded-[28px] border border-line bg-white p-6 sm:p-9">
        <div className="hero-glow absolute inset-0" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">
                {greeting()}, {firstName} 👋
              </p>
              <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-tight sm:text-4xl">
                What are you <span className="font-display italic brand-text">looking for?</span>
              </h1>
              <p className="mt-2 text-sm text-muted">
                {items.length} saves · {sections.length} sections · {thisMonth} saved this month
              </p>
            </div>
          </div>
          <div className="mt-6 max-w-3xl">
            <AskBar placeholder="e.g. “that Bali reel from a few months back” or “plan my weekend from my saves”" />
          </div>
          <div className="mt-3">
            <PromptChips
              prompts={[
                ...(topSections[0] ? [`Plan something from my ${topSections[0]} saves`] : []),
                "What did I save this month?",
                ...(topSections[1] ? [`Summarise my ${topSections[1]} saves`] : []),
                "What did I save and forget about?",
              ]}
            />
          </div>
        </div>
      </section>

      {doneSteps < steps.length && (
        <Card className="rise-2 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Get set up</p>
              <p className="text-sm text-muted">
                {doneSteps} of {steps.length} done. Each step makes ReelMind more useful.
              </p>
            </div>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
              <div className="brand-gradient h-full" style={{ width: `${(doneSteps / steps.length) * 100}%` }} />
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-5">
            {steps.map((s, i) => (
              <Link key={s.label} href={s.href} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${s.done ? "border-emerald-200 bg-emerald-50/60 text-emerald-800" : "border-line hover:border-violet-300"}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${s.done ? "bg-emerald-500 text-white" : "bg-canvas text-muted ring-1 ring-line"}`}>{s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
                <span className={s.done ? "line-through decoration-emerald-400" : "font-medium"}>{s.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="overflow-hidden">
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <h2 className="text-lg font-semibold">Your library is empty. Let&apos;s fill it.</h2>
              <p className="mt-1 max-w-lg text-sm text-muted">
                Send your link code to our bot once. After that, tap <b>Share → Send</b> on any reel or post and pick the bot. It lands here, sorted into sections.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/app/connect" className={btn.brand}>
                <Send className="h-4 w-4" /> Connect Instagram
              </Link>
              <AddSave compact />
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <SectionTitle icon={<Bell className="h-4 w-4" />} title="Reminders" action={<Link href="/app/reminders" className="text-xs font-medium text-brand">All</Link>} />
              {dueReminders.length === 0 ? (
                <p className="text-sm text-muted">Nothing due. Open any save and tap “Remind me”.</p>
              ) : (
                <div className="space-y-1.5">
                  {dueReminders.slice(0, 4).map((r) => {
                    const it = views.find((v) => v.id === r.itemId);
                    return it ? (
                      <Link key={r.id} href={`/app/saves/${it.id}`} className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-3 py-2 text-sm hover:bg-amber-100">
                        <span>{it.section?.emoji ?? "🗂️"}</span>
                        <span className="min-w-0 flex-1 truncate">{it.title}</span>
                      </Link>
                    ) : null;
                  })}
                </div>
              )}
            </Card>
            <Card className="p-5">
              <SectionTitle icon={<ListChecks className="h-4 w-4" />} title="Try list" action={<Link href="/app/todo" className="text-xs font-medium text-brand">Open</Link>} />
              {openTodos.length === 0 ? (
                <p className="text-sm text-muted">Turn saves into action: open a save and tap “Add to try list”.</p>
              ) : (
                <ul className="space-y-1.5">
                  {openTodos.slice(0, 4).map((t) => (
                    <li key={t.id} className="flex items-center gap-2.5 text-sm">
                      <span className="h-4 w-4 shrink-0 rounded-full border-2 border-violet-300" />
                      <span className="truncate">{t.text}</span>
                    </li>
                  ))}
                  {openTodos.length > 4 && <li className="pl-6 text-xs text-muted">+{openTodos.length - 4} more</li>}
                </ul>
              )}
            </Card>
            <Card className="p-5">
              <SectionTitle icon={<CalendarRange className="h-4 w-4" />} title="Plan something" action={<Link href="/app/planner" className="text-xs font-medium text-brand">Planner</Link>} />
              <div className="grid grid-cols-2 gap-1.5">
                {(["trip", "workout", "meals", "study"] as const).map((k) => (
                  <Link key={k} href="/app/planner" className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-[13px] font-medium hover:bg-violet-50">
                    <span>{TEMPLATES[k].emoji}</span> <span className="truncate">{TEMPLATES[k].title}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <section>
            <SectionTitle title="Your sections" hint="Created by AI from what you save" action={<Link href="/app/sections" className="inline-flex items-center gap-1 text-sm font-medium text-brand">All <ArrowRight className="h-3.5 w-3.5" /></Link>} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sections.slice(0, 8).map((s) => (
                <Link key={s.id} href={`/app/sections/${s.slug}`} className="lift group relative overflow-hidden rounded-2xl border border-line p-4" style={tileStyle(s.slug)}>
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{s.emoji}</span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">{s.count}</span>
                  </div>
                  <h3 className="mt-6 font-semibold">{s.name}</h3>
                  <p className="line-clamp-1 text-xs text-ink/60">Latest {s.latest ? timeAgo(s.latest) : ""}</p>
                  <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 opacity-0 transition group-hover:opacity-60" />
                </Link>
              ))}
            </div>
          </section>

          {memories.length > 0 && (
            <section>
              <SectionTitle icon={<Clock className="h-4 w-4" />} title="Remember these?" hint="Saves you probably forgot about" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {memories.map((m) => (
                  <ItemCard key={m.id} item={m} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="Recently saved" action={<Link href="/app/library" className="inline-flex items-center gap-1 text-sm font-medium text-brand">See all <ArrowRight className="h-3.5 w-3.5" /></Link>} />
            <ItemGrid items={views.slice(0, 10)} />
          </section>
        </>
      )}
    </div>
  );
}
