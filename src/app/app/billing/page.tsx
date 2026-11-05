import type { Metadata } from "next";
import { Check, PartyPopper, Receipt } from "lucide-react";
import { CheckoutButton, DowngradeButton } from "@/components/checkout";
import { Badge, Card, PageHeader, Progress, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { razorpayConfigured } from "@/lib/billing";
import { daysUntil, fmtDate } from "@/lib/format";
import { asksToday, inr, PLANS, plansThisMonth, saveCount, yearlySaving } from "@/lib/plans";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Billing" };

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted">{limit === null ? `${used} · unlimited` : `${used} of ${limit}`}</span>
      </div>
      {limit !== null ? <Progress value={used} max={limit} /> : <div className="brand-gradient h-2 rounded-full opacity-30" />}
    </div>
  );
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ upgrade?: string; welcome?: string }> }) {
  const user = await requireUser();
  const { upgrade, welcome } = await searchParams;
  const db = await readDb();
  const plan = PLANS[user.plan];
  const pro = user.plan === "pro";
  const payments = db.payments.filter((p) => p.userId === user.id && p.status === "paid").sort((a, b) => b.at.localeCompare(a.at));
  const devMode = !razorpayConfigured();
  const daysLeft = user.planRenewsAt ? daysUntil(user.planRenewsAt) : null;

  return (
    <div className="rise space-y-6">
      <PageHeader eyebrow="Account" title="Plan & billing" subtitle="Your plan, usage and receipts." />

      {welcome && pro && (
        <div className="rise flex items-center gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-5 py-4">
          <PartyPopper className="h-6 w-6 text-violet-600" />
          <p className="text-sm">
            <b>Welcome to Pro!</b> Unlimited saves and questions, DM answers and reminders are on.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Current plan</p>
              <p className="mt-0.5 flex items-center gap-2 text-2xl font-semibold">
                {plan.name} {pro ? <Badge tone="violet">{user.billingInterval === "month" ? "Monthly" : "Yearly"}</Badge> : <Badge tone="gray">Free forever</Badge>}
              </p>
            </div>
            {pro && user.planRenewsAt && (
              <div className="text-right text-sm">
                <p className="font-medium">Active until {fmtDate(user.planRenewsAt)}</p>
                <p className="text-muted">{daysLeft} days left · no auto-renewal</p>
              </div>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <Meter label="Saves" used={saveCount(db, user.id)} limit={plan.saveLimit} />
            <Meter label="Questions today" used={asksToday(user)} limit={plan.askPerDay} />
            <Meter label="Collections" used={db.collections.filter((c) => c.userId === user.id).length} limit={plan.collectionLimit} />
            <Meter label="AI plans this month" used={plansThisMonth(db, user.id)} limit={plan.plansPerMonth} />
          </div>
        </Card>

        <Card className={`p-6 ${pro ? "" : "brand-ring border-violet-300"}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">{pro ? "Renew or switch" : "Upgrade to Pro"}</p>
          <ul className="my-4 space-y-2">
            {PLANS.pro.perks.slice(0, 6).map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500" /> {p}
              </li>
            ))}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-violet-300 bg-violet-50/50 p-4">
              <p className="text-xs font-semibold text-violet-700">Yearly · save {yearlySaving()}%</p>
              <p className="mt-1 text-2xl font-semibold">{inr(PLANS.pro.yearly)}</p>
              <p className="mb-3 text-xs text-muted">≈ {inr(Math.round(PLANS.pro.yearly / 12))}/month</p>
              <CheckoutButton interval="year" label={pro ? "Add a year" : "Get yearly"} autoStart={upgrade === "year" && !pro} />
            </div>
            <div className="rounded-2xl border border-line p-4">
              <p className="text-xs font-semibold text-muted">Monthly</p>
              <p className="mt-1 text-2xl font-semibold">{inr(PLANS.pro.monthly)}</p>
              <p className="mb-3 text-xs text-muted">per month</p>
              <CheckoutButton interval="month" label={pro ? "Add a month" : "Get monthly"} autoStart={upgrade === "month" && !pro} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white disabled:opacity-50" />
            </div>
          </div>
          <p className="mt-4 text-xs text-muted">UPI, cards, net banking & wallets via Razorpay. Prepaid, never auto-renews.</p>
          {devMode && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Development mode: Razorpay keys aren&apos;t set, so upgrades are applied instantly without payment.</p>}
          {devMode && pro && (
            <div className="mt-3">
              <DowngradeButton />
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <SectionTitle icon={<Receipt className="h-4 w-4" />} title="Payment history" />
        {payments.length === 0 ? (
          <p className="text-sm text-muted">No payments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5">{fmtDate(p.at)}</td>
                  <td className="py-2.5">Pro · {p.interval === "year" ? "1 year" : "1 month"}</td>
                  <td className="py-2.5">{p.provider === "dev" ? <span className="text-muted">Test (₹0)</span> : inr(p.amount / 100)}</td>
                  <td className="py-2.5 font-mono text-xs text-muted">{p.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
