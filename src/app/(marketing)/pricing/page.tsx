import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { CtaBand, Faq, MarketingHero } from "@/components/marketing";
import { PricingTable } from "@/components/pricing-table";
import { PLANS, yearlySaving } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing", description: "Start free with 50 saves. ReelMind Pro is ₹299/month or ₹2,499/year." };

const ROWS: [string, string | boolean, string | boolean][] = [
  ["Saved reels & posts", `${PLANS.free.saveLimit}`, "Unlimited"],
  ["AI sections, summaries, tags", true, true],
  ["Questions to the AI", `${PLANS.free.askPerDay} / day`, "Unlimited"],
  ["Collections", `${PLANS.free.collectionLimit}`, "Unlimited"],
  ["AI plans (trips, workouts, meals…)", `${PLANS.free.plansPerMonth} / month`, "Unlimited"],
  ["Try list & reminders", true, true],
  ["Ask the bot in Instagram DMs", false, true],
  ["Reminders sent to your DMs", false, true],
  ["Public share links for collections", true, true],
  ["Places, creators & insights", true, true],
  ["Export CSV / JSON", false, true],
  ["Priority AI processing", false, true],
];

export default function PricingPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Pricing"
        title={
          <>
            Simple pricing. <span className="font-display italic brand-text">Cancel any time.</span>
          </>
        }
        subtitle="Start free and upgrade when your saves outgrow it. Prices in INR, including taxes."
      />
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-12">
        <PricingTable free={PLANS.free} pro={PLANS.pro} saving={yearlySaving()} />
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-24">
        <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight">Compare plans</h2>
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left">
              <tr>
                <th className="px-5 py-3 font-medium text-muted">Feature</th>
                <th className="w-32 px-5 py-3 font-semibold">Free</th>
                <th className="w-32 px-5 py-3 font-semibold text-brand">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROWS.map(([f, a, b]) => (
                <tr key={f}>
                  <td className="px-5 py-3">{f}</td>
                  <Cell v={a} />
                  <Cell v={b} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-10">
        <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight">Billing questions</h2>
        <Faq
          items={[
            ["How do I pay?", "UPI, cards, net banking and wallets through Razorpay. You'll get a receipt by email."],
            ["Will I be charged automatically?", "No. Pro is prepaid for a month or a year and never auto-renews. We remind you before it ends, and you renew with one tap if you want to."],
            ["Is there a refund?", "If ReelMind isn't for you, write to us within 7 days of your first Pro payment and we'll refund it in full."],
            ["Do you offer student pricing?", "Write to us from your college email and we'll set you up with a discount."],
            ["What happens if I go over the free limit?", "Nothing is lost. The bot tells you the library is full, and new saves start again as soon as you upgrade or delete some."],
          ]}
        />
      </section>
      <CtaBand />
    </>
  );
}

function Cell({ v }: { v: string | boolean }) {
  return (
    <td className="px-5 py-3">
      {v === true ? <Check className="h-4 w-4 text-emerald-500" /> : v === false ? <Minus className="h-4 w-4 text-ink/25" /> : <span className="font-medium">{v}</span>}
    </td>
  );
}
