import Link from "next/link";
import { ArrowRight, Bell, Brain, CalendarRange, Check, FolderHeart, FolderTree, LineChart, ListChecks, MapPin, MessageCircle, Send, Share2, Sparkles } from "lucide-react";
import { CtaBand, Eyebrow, Faq, FAQ } from "@/components/marketing";
import { AnswerMock, DashboardMock, PhoneDm, TryListMock } from "@/components/mockups";
import { btn } from "@/components/ui";
import { USE_CASES } from "@/lib/use-cases";
import { inr, PLANS, yearlySaving } from "@/lib/plans";

const QUESTIONS = [
  "that café reel I saved in summer?",
  "plan 3 days in Goa from my saves",
  "a 20-min workout I saved for home",
  "what helps when I overthink?",
  "shopping list from my saved recipes",
  "the money tips about SIPs",
  "gift ideas I saved for mom",
  "skincare routine from that creator",
  "places to visit in Ladakh",
  "what did I save last month?",
];

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0" />
        <div className="grid-bg absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-16 pt-14 lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-20">
          <div className="rise">
            <Link href="/features" className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 py-1 pl-1 pr-3 text-xs font-medium text-violet-700 shadow-sm backdrop-blur transition hover:border-violet-300">
              <span className="brand-gradient rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">New</span>
              AI planner: trips, workouts & meals from your saves <ArrowRight className="h-3 w-3" />
            </Link>
            <h1 className="mt-6 text-[44px] font-semibold leading-[1.04] tracking-tight sm:text-[64px]">
              You save it.
              <br />
              <span className="font-display text-[1.12em] italic brand-text">We remember it.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Share reels and posts to the ReelMind bot on Instagram. AI sorts them into sections of your life, pulls out the places, steps and recipes, and answers anything you ask,
              months later.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className={`${btn.brand} px-6 py-3 text-[15px]`}>
                Start free, no card <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#how" className={`${btn.ghost} px-6 py-3 text-[15px]`}>
                See how it works
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/70">
              {["No Instagram password", "Works with Hinglish", "50 saves free forever"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rise-2 relative">
            <div className="brand-gradient absolute left-10 top-10 h-64 w-64 rounded-full opacity-20 blur-3xl" />
            <div className="relative grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <div className="float">
                <PhoneDm />
              </div>
              <div className="float-slow hidden space-y-4 sm:block">
                <div className="rounded-2xl border border-line bg-white p-4 shadow-xl shadow-violet-900/10">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Sorted automatically</p>
                  <p className="mt-2 text-sm font-semibold">5 hidden beaches in South Goa</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">Butterfly, Cola, Kakolem, Galgibaga and Talpona. Best Nov to Feb. Go at low tide.</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {["✈️ Travel", "Goa", "📍 5 places"].map((t) => (
                      <span key={t} className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-white p-4 shadow-xl shadow-violet-900/10">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <Bell className="h-3 w-3" /> Reminder · Dec 1
                  </p>
                  <p className="text-sm">Your Goa trip is in 2 weeks. Want the beach plan?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Questions marquee */}
      <section className="border-y border-line bg-canvas py-5">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted">Things people ask their saves</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="marquee flex w-max gap-3">
            {[...QUESTIONS, ...QUESTIONS].map((q, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-white px-4 py-2 text-sm text-ink/80">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" /> {q}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>The problem</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[42px] sm:leading-[1.1]">
              Your saved folder is a <span className="font-display italic">graveyard</span> of good intentions.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              The trip itinerary, the 10-minute workout, the recipe, the advice that hit hard at 2am. You saved it so you&apos;d use it later. Then it disappeared under hundreds of others,
              with no search and no way to find it.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["🔎", "No search", "Instagram can't search your saves"],
                ["🗂️", "No order", "One endless grid"],
                ["🫥", "No memory", "You forget what's in there"],
              ].map(([e, t, d]) => (
                <div key={t} className="rounded-2xl border border-line bg-white p-4">
                  <p className="text-2xl">{e}</p>
                  <p className="mt-2 text-sm font-semibold">{t}</p>
                  <p className="mt-0.5 text-xs text-muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
          <AnswerMock />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-canvas py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[42px]">Three steps. Then it just works.</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { icon: Send, t: "Send it to the bot", d: "Tap Share on any reel or post and send it to @reelmind.ai, exactly like sending it to a friend. Add a note if you like." },
              { icon: FolderTree, t: "AI sorts it for you", d: "Every save gets a title, summary, key points, places and tags, and lands in a section the AI creates for your life." },
              { icon: MessageCircle, t: "Ask, months later", d: "“What gym routines did I save?” “Plan my Goa trip.” Ask on the dashboard or right in your Instagram DMs." },
            ].map(({ icon: Icon, t, d }, i) => (
              <div key={t} className="relative rounded-3xl border border-line bg-white p-7">
                <span className="absolute right-6 top-6 font-display text-5xl italic text-violet-100">0{i + 1}</span>
                <span className="brand-gradient grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature bento */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Everything in one place</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[42px]">Not just a folder. A brain.</h2>
          <p className="mt-4 text-lg text-muted">ReelMind turns passive saving into things you actually do.</p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <div className="rounded-3xl border border-line bg-white p-7 md:col-span-4">
            <Feature icon={FolderTree} title="AI sections for your life" body="Travel, fitness, recipes, money, feelings, skills. Sections are created from what you save, with subtopics like Goa, leg day or biryani." />
            <div className="mt-6">
              <DashboardMock />
            </div>
          </div>
          <div className="flex flex-col rounded-3xl border border-line bg-white p-7 md:col-span-2">
            <Feature icon={ListChecks} title="Try list" body="Every save's “things to do” become a checklist you can tick off. Saving finally turns into doing." />
            <div className="mt-6 flex-1">
              <TryListMock />
            </div>
          </div>
          <div className="night rounded-3xl p-7 text-white md:col-span-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
              <CalendarRange className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">AI planner</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">Pick a template (trip, workout week, meal plan, study plan, date night) and get a plan built from your own saves, with every step linked back.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["🧳 Trip", "🏋️ Workout week", "🥗 Meal plan", "📚 Study plan", "💝 Date night"].map((t) => (
                <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-white p-7 md:col-span-3">
            <Feature icon={FolderHeart} title="Collections you can share" body="Group saves into boards like “Goa, December” or “Wedding ideas”, then share a beautiful public link with friends." />
            <div className="mt-5 flex -space-x-2">
              {["🏖️", "🍹", "🛵", "🌅", "🏨"].map((e) => (
                <span key={e} className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-amber-100 to-rose-200 text-lg ring-4 ring-white">
                  {e}
                </span>
              ))}
            </div>
          </div>
          {[
            { icon: Bell, t: "Reminders in your DMs", d: "“Remind me before my trip.” ReelMind messages you on Instagram when it's time." },
            { icon: MapPin, t: "Places, collected", d: "Every café, beach and city from your saves in one list, one tap from Google Maps." },
            { icon: LineChart, t: "Insights", d: "See what you save most, which creators you love, and what you've forgotten." },
          ].map(({ icon, t, d }) => (
            <div key={t} className="rounded-3xl border border-line bg-white p-7 md:col-span-2">
              <Feature icon={icon} title={t} body={d} />
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/features" className={btn.ghost}>
            Explore all features <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-y border-line bg-canvas py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Use cases</Eyebrow>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[42px]">Whatever you save, it gets used.</h2>
            </div>
            <Link href="/use-cases" className="inline-flex items-center gap-1 text-sm font-medium text-brand">
              All use cases <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.slice(0, 8).map((u) => (
              <Link key={u.slug} href={`/use-cases#${u.slug}`} className="lift group rounded-3xl border border-line bg-white p-6">
                <span className="text-3xl">{u.emoji}</span>
                <h3 className="mt-4 font-semibold">{u.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{u.short}</p>
                <p className="mt-4 rounded-xl bg-canvas px-3 py-2 text-xs italic text-ink/70">“{u.asks[0]}”</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Brain, t: "Private by design", d: "Your library is yours. We never post, never read your other DMs and never sell your data." },
            { icon: Share2, t: "No password, ever", d: "You link Instagram by sending a code to the bot. Disconnect any time from settings." },
            { icon: Sparkles, t: "You own your data", d: "Export everything as CSV or JSON whenever you want. Delete your account in one click." },
          ].map(({ icon, t, d }) => (
            <div key={t} className="rounded-3xl border border-line p-7">
              <Feature icon={icon} title={t} body={d} />
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-y border-line bg-canvas py-24">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[42px]">Less than one coffee a month.</h2>
          <p className="mt-4 text-lg text-muted">
            Start free with {PLANS.free.saveLimit} saves. Go Pro for {inr(PLANS.pro.monthly)}/month, or {inr(PLANS.pro.yearly)}/year (save {yearlySaving()}%).
          </p>
          <div className="mt-10 grid gap-5 text-left md:grid-cols-2">
            {(["free", "pro"] as const).map((p) => (
              <div key={p} className={`rounded-3xl border bg-white p-7 ${p === "pro" ? "brand-ring border-violet-300" : "border-line"}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{PLANS[p].name}</p>
                  {p === "pro" && <span className="brand-gradient rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white">Most popular</span>}
                </div>
                <p className="mt-3 text-4xl font-semibold tracking-tight">
                  {inr(PLANS[p].monthly)}
                  <span className="text-base font-normal text-muted"> / month</span>
                </p>
                <ul className="my-6 space-y-2.5">
                  {PLANS[p].perks.slice(0, 5).map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" /> {perk}
                    </li>
                  ))}
                </ul>
                <Link href={p === "pro" ? "/pricing" : "/signup"} className={`${p === "pro" ? btn.brand : btn.ghost} w-full`}>
                  {p === "pro" ? "See Pro plans" : "Start free"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-24">
        <div className="text-center">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Questions, answered</h2>
        </div>
        <div className="mt-10">
          <Faq items={FAQ.slice(0, 6)} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function Feature({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
