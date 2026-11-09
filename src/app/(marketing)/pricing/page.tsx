import type { Metadata } from "next";
import { Check, CreditCard, Globe, Minus, RefreshCcw, ShieldCheck } from "lucide-react";
import { CtaBand, Faq, MarketingHero } from "@/components/marketing";
import { PricingTable } from "@/components/pricing-table";
import { getCurrency } from "@/lib/locale";
import { money, PLANS, PRICES } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Start free with 50 saves. ReelMind Pro from ${money(PRICES.pro.USD.month, "USD")}/month, Premium from ${money(PRICES.premium.USD.month, "USD")}/month. Pay in USD, EUR, GBP or INR.`,
};

type Cell = string | boolean | "soon";
const GROUPS: { title: string; rows: [string, Cell, Cell, Cell][] }[] = [
  {
    title: "Your library",
    rows: [
      ["Saved reels & posts", `${PLANS.free.saveLimit}`, "Unlimited", "Unlimited"],
      ["AI sections, summaries, tags", true, true, true],
      ["Collections", `${PLANS.free.collectionLimit}`, "Unlimited", "Unlimited"],
      ["Public share links for collections", true, true, true],
      ["Places, creators & insights", true, true, true],
    ],
  },
  {
    title: "AI",
    rows: [
      ["Questions to the AI", `${PLANS.free.askPerDay} / day`, "Unlimited", "Unlimited"],
      ["AI plans (trips, workouts, meals…)", `${PLANS.free.plansPerMonth} / month`, "Unlimited", "Unlimited"],
      ["Ask the bot in Instagram DMs", false, true, true],
      ["Weekly AI digest", false, false, true],
      ["Reel audio transcription", false, false, "soon"],
    ],
  },
  {
    title: "Stay on track",
    rows: [
      ["Try list & in-app reminders", true, true, true],
      ["Reminders sent to your DMs", false, true, true],
      ["Calendar sync (Google, Apple, Outlook)", false, false, true],
      ["Habits heatmap, streaks & follow-through", false, false, true],
    ],
  },
  {
    title: "Your data",
    rows: [
      ["Export CSV / JSON", false, true, true],
      ["Markdown export for Notion & Obsidian", false, false, true],
      ["Support", "Help centre", "Email", "Priority email"],
    ],
  },
];

export default async function PricingPage() {
  const currency = await getCurrency();
  return (
    <>
      <MarketingHero
        eyebrow="Pricing"
        title={
          <>
            Pick a plan. <span className="font-display italic brand-text">Pay your way.</span>
          </>
        }
        subtitle="Start free and upgrade when your saves outgrow it. Prices in your currency, prepaid, never auto-renewed."
      />
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12">
        <PricingTable currency={currency} />
        <div className="mt-10 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Globe, t: "4 currencies", d: "USD, EUR, GBP and INR" },
            { icon: CreditCard, t: "Pay how you like", d: "Cards worldwide, UPI & wallets in India" },
            { icon: RefreshCcw, t: "No auto-renewal", d: "Prepaid. Renew only if you want to" },
            { icon: ShieldCheck, t: "7-day refund", d: "Full refund, no questions asked" },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="text-xs text-muted">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <h2 className="mb-2 text-center text-3xl font-semibold tracking-tight">Compare plans</h2>
        <p className="mb-8 text-center text-muted">Everything in a lower plan is included in the ones above it.</p>
        <div className="overflow-x-auto rounded-3xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 bg-white/95 text-left backdrop-blur">
              <tr className="border-b border-line">
                <th className="px-6 py-4 font-medium text-muted">Feature</th>
                <th className="w-36 px-4 py-4 font-semibold">Free</th>
                <th className="w-36 bg-violet-50/60 px-4 py-4 font-semibold text-brand">Pro</th>
                <th className="w-36 px-4 py-4 font-semibold text-amber-600">Premium</th>
              </tr>
            </thead>
            {GROUPS.map((g) => (
              <tbody key={g.title}>
                <tr>
                  <td colSpan={4} className="bg-canvas px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {g.title}
                  </td>
                </tr>
                {g.rows.map(([f, a, b, c]) => (
                  <tr key={f} className="border-t border-line/70">
                    <td className="px-6 py-3.5">{f}</td>
                    <CellView v={a} />
                    <CellView v={b} tint />
                    <CellView v={c} />
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-10">
        <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight">Billing questions</h2>
        <Faq
          items={[
            ["Which currencies can I pay in?", "US dollars, euros, British pounds and Indian rupees. We pick one from your location; switch any time with the currency picker above the plans. You're charged exactly the price you see."],
            ["How do I pay?", "All major credit and debit cards worldwide. In India you can also use UPI, net banking and wallets. Payments are processed securely by Razorpay and you get a receipt by email."],
            ["Will I be charged automatically?", "No. Plans are prepaid for a month or a year and never auto-renew. We remind you before your plan ends and you renew with one tap if you want to."],
            ["What's the difference between Pro and Premium?", "Pro removes every limit and adds DM answers, DM reminders and export. Premium adds the weekly AI digest, habits insights, calendar sync and Markdown export, and puts you first in the support queue."],
            ["Can I switch from Pro to Premium later?", "Yes. Your unused Pro time carries over to Premium, scaled to the price difference, so you never pay twice for the same days."],
            ["Are taxes included?", "Prices include taxes where we're required to collect them. Businesses can request invoices with VAT or GST details."],
            ["Is there a refund?", "If ReelMind isn't for you, write to us within 7 days of your first payment and we'll refund it in full."],
            ["Do you offer student pricing?", "Yes. Write to us from your school or university email and we'll set you up with a discount."],
          ]}
        />
      </section>
      <CtaBand />
    </>
  );
}

function CellView({ v, tint }: { v: Cell; tint?: boolean }) {
  return (
    <td className={`px-4 py-3.5 ${tint ? "bg-violet-50/40" : ""}`}>
      {v === true ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : v === false ? (
        <Minus className="h-4 w-4 text-ink/20" />
      ) : v === "soon" ? (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">Soon</span>
      ) : (
        <span className="font-medium">{v}</span>
      )}
    </td>
  );
}
