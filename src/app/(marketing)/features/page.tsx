import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CalendarRange, Command, AtSign, Download, FolderHeart, FolderTree, LineChart, ListChecks, MapPin, MessageCircle, Share2, Sparkles, Users } from "lucide-react";
import { CtaBand, MarketingHero } from "@/components/marketing";
import { AnswerMock, DashboardMock, TryListMock } from "@/components/mockups";
import { btn } from "@/components/ui";

export const metadata: Metadata = { title: "Features", description: "AI sections, ask anything, AI planner, try list, collections, reminders, places and insights." };

const ALL = [
  { icon: FolderTree, t: "AI sections", d: "Saves are filed into broad life areas with subtopics, created by AI from what you actually save." },
  { icon: Sparkles, t: "Rich summaries", d: "Title, summary, key points, action items, places, people, products and mood for every save." },
  { icon: MessageCircle, t: "Ask anything", d: "Vague questions welcome. Answers cite the exact saves they came from." },
  { icon: AtSign, t: "Ask in your DMs", d: "Text the bot a question and get an answer with links, without opening the app." },
  { icon: CalendarRange, t: "AI planner", d: "Trips, workout weeks, meal plans, study plans, self-care and date nights from your saves." },
  { icon: ListChecks, t: "Try list", d: "Action items from saves become a checklist. Tick them off as you go." },
  { icon: FolderHeart, t: "Collections", d: "Hand-picked boards for trips, events or projects, separate from AI sections." },
  { icon: Share2, t: "Public share links", d: "Share any collection as a beautiful read-only page. Turn sharing off any time." },
  { icon: Bell, t: "Reminders", d: "Pick a date for any save. Get it on your dashboard and as an Instagram DM." },
  { icon: MapPin, t: "Places", d: "Every place from your saves in one searchable list with Google Maps links." },
  { icon: Users, t: "Creators", d: "See the creators you save from most and everything you saved from each." },
  { icon: LineChart, t: "Insights", d: "Saving trends, top sections, forgotten saves and what you actually used." },
  { icon: Command, t: "Quick search", d: "Press ⌘K anywhere to jump to any save, section or page." },
  { icon: Download, t: "Export", d: "Download your whole library as CSV or JSON. Your data stays yours." },
];

export default function FeaturesPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Features"
        title={
          <>
            From saved to <span className="font-display italic brand-text">done.</span>
          </>
        }
        subtitle="Everything ReelMind does to turn a pile of saved reels into a library you can search, plan from and act on."
      >
        <Link href="/signup" className={btn.brand}>
          Start free <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/pricing" className={btn.ghost}>
          Pricing
        </Link>
      </MarketingHero>

      <section className="mx-auto max-w-6xl space-y-24 px-5 py-24">
        <Spotlight eyebrow="Organise" title="A library that sorts itself" body="Send a reel and within seconds it has a title, a summary, the key points, the places and the tags, filed into a section like ✈️ Travel → Goa. Move things, add notes or create your own sections whenever you like.">
          <DashboardMock />
        </Spotlight>
        <Spotlight flip eyebrow="Remember" title="Ask like you'd ask a friend" body="“That café reel from summer.” “The workout with resistance bands.” ReelMind understands vague memories and approximate dates, searches everything you saved and answers with cards that link to the exact saves.">
          <AnswerMock />
        </Spotlight>
        <Spotlight eyebrow="Act" title="Turn saves into things you do" body="Every save's action items land in your Try list. Pick a template in the planner and get a trip, workout week or meal plan built from your saves, then set reminders so they don't slip.">
          <div className="hero-glow rounded-3xl border border-line bg-canvas p-6">
            <TryListMock />
          </div>
        </Spotlight>
      </section>

      <section className="border-y border-line bg-canvas py-24">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-[40px]">Everything included</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALL.map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex gap-4 rounded-2xl border border-line bg-white p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

function Spotlight({ eyebrow, title, body, children, flip }: { eyebrow: string; title: string; body: string; children: React.ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div className={flip ? "lg:order-2" : ""}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[40px] sm:leading-[1.1]">{title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{body}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
