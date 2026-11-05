import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarRange, CreditCard, FolderHeart, MessageCircle, Send } from "lucide-react";
import { Faq, FAQ, MarketingHero } from "@/components/marketing";

export const metadata: Metadata = { title: "Help centre", description: "Guides and answers for ReelMind." };

const GUIDES = [
  {
    icon: Send,
    t: "Connect Instagram",
    steps: ["Sign up and open Instagram in the dashboard.", "Follow the bot account and open a chat with it.", "Send the RM- code shown on the page. The bot replies “You're connected”."],
  },
  {
    icon: Send,
    t: "Save a reel or post",
    steps: ["Tap the paper-plane Share icon on any reel or post.", "Pick the ReelMind bot as if it were a friend.", "Optional: type a note in the same message, e.g. “for December trip”."],
  },
  {
    icon: MessageCircle,
    t: "Ask about your saves",
    steps: ["Open Ask, or press ⌘K / Ctrl+K and type your question.", "Be vague if you like: “that pasta reel from a while back”.", "Tap any card in the answer to open the save."],
  },
  {
    icon: CalendarRange,
    t: "Make a plan",
    steps: ["Open Planner and pick a template, e.g. Trip.", "Say what you want: “4 days in Goa in December, budget ₹20k”.", "ReelMind builds it from your saves. It's kept under Planner."],
  },
  {
    icon: FolderHeart,
    t: "Collections & sharing",
    steps: ["Create a collection from Collections, or “Add to collection” on any save.", "Select many saves in Library to add them at once.", "Turn on the share link to send a read-only page to friends."],
  },
  {
    icon: Bell,
    t: "Reminders",
    steps: ["Open a save and choose “Remind me”.", "Pick a date: tomorrow, this weekend, next month or your own.", "It shows on Home, and as an Instagram DM if you're on Pro."],
  },
  {
    icon: CreditCard,
    t: "Plans & billing",
    steps: ["Billing shows your usage and plan.", "Upgrade with UPI, cards or net banking.", "Pro is prepaid and never auto-renews. Renew from Billing."],
  },
];

export default function HelpPage() {
  return (
    <>
      <MarketingHero eyebrow="Help centre" title="How can we help?" subtitle="Short guides for everything in ReelMind. Still stuck? We're one message away." />
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map(({ icon: Icon, t, steps }) => (
            <div key={t} className="rounded-3xl border border-line bg-white p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-semibold">{t}</h2>
              <ol className="mt-3 space-y-2">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-canvas text-[11px] font-semibold text-ink">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight">Frequently asked</h2>
        <Faq items={FAQ} />
        <p className="mt-8 text-center text-sm text-muted">
          Didn&apos;t find it?{" "}
          <Link href="/contact" className="font-medium text-brand">
            Contact support
          </Link>
        </p>
      </section>
    </>
  );
}
