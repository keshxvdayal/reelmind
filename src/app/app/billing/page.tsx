import type { Metadata } from "next";
import { Check, Crown, PartyPopper, Receipt, ShieldCheck, Sparkles } from "lucide-react";
import { CheckoutButton, DowngradeButton } from "@/components/checkout";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { Card, PageHeader, PlanPill, Progress, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { razorpayConfigured } from "@/lib/billing";
import { daysUntil, fmtDate } from "@/lib/format";
import { getCurrency } from "@/lib/locale";
import { asksToday, atLeast, money, perMonthYearly, PLANS, plansThisMonth, PRICES, saveCount, yearlySaving } from "@/lib/plans";
import { readDb } from "@/lib/store";
import type { BillingInterval, PaidPlan } from "@/lib/types";

export const metadata: Metadata = { title: "Billing" };

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const near = limit !== null && used / limit >= 0.8;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={near ? "font-medium text-rose-600" : "text-muted"}>{limit === null ? `${used} · unlimited` : `${used} of ${limit}`}</span>
      </div>
      {limit !== null ? <Progress value={used} max={limit} /> : <div className="brand-gradient h-2 rounded-full opacity-25" />}
    </div>
  );
}

/** "pro-year", "premium-month", or the older "year"/"month" (meaning Pro). */
function parseUpgrade(v?: string): { plan: PaidPlan; interval: BillingInterval } | null {
  if (!v) return null;
  const [a, b] = v.split("-");
  if (a === "year" || a === "month") return { plan: "pro", interval: a };
  if ((a === "pro" || a === "premium") && (b === "year" || b === "month")) return { plan: a, interval: b };
  return null;
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ upgrade?: string; welcome?: string }> }) {
  const user = await requireUser();
  const { upgrade, welcome } = await searchParams;
  const db = await readDb();
  const currency = await getCurrency();
  const plan = PLANS[user.plan];
  const paid = user.plan !== "free";
  const payments = db.payments.filter((p) => p.userId === user.id && p.status === "paid").sort((a, b) => b.at.localeCompare(a.at));
  const devMode = !razorpayConfigured();
  const daysLeft = user.planRenewsAt ? daysUntil(user.planRenewsAt) : null;
  const periodDays = user.billingInterval === "month" ? 31 : 365;
  const auto = parseUpgrade(upgrade);

  const buttonLabel = (target: PaidPlan, interval: BillingInterval) => {
    const unit = interval === "year" ? "year" : "month";
    if (user.plan === target) return `Add a ${unit}`;
    if (atLeast(user.plan, target)) return `Switch to ${PLANS[target].name}`;
    return interval === "year" ? "Get yearly" : "Get monthly";
  };

  return (
    <div className="rise space-y-6">
      <PageHeader eyebrow="Account" title="Plan & billing" subtitle="Your plan, usage and receipts." action={<CurrencySwitcher value={currency} />} />

      {welcome && paid && (
        <div className={`rise flex items-center gap-3 rounded-2xl border px-5 py-4 ${user.plan === "premium" ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50" : "border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50"}`}>
          <PartyPopper className={`h-6 w-6 ${user.plan === "premium" ? "text-amber-600" : "text-violet-600"}`} />
          <p className="text-sm">
            <b>Welcome to {plan.name}!</b>{" "}
            {user.plan === "premium" ? "Your weekly digest, habits insights and calendar sync are ready." : "Unlimited saves and questions, DM answers and reminders are on."}
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className={`relative overflow-hidden rounded-3xl p-6 ${user.plan === "premium" ? "premium-card" : user.plan === "pro" ? "night text-white" : "soft-shadow border border-line bg-white"}`}>
          {paid && <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl ${user.plan === "premium" ? "premium-gradient" : "brand-gradient"}`} />}
          <div className="relative">
            <p className={`text-sm ${paid ? "text-white/60" : "text-muted"}`}>Current plan</p>
            <p className="mt-1 flex items-center gap-2.5 text-3xl font-semibold tracking-tight">
              {user.plan === "premium" && <Crown className="h-7 w-7 text-amber-300" />}
              <span className={user.plan === "premium" ? "premium-text" : ""}>{plan.name}</span>
              <PlanPill plan={user.plan} />
            </p>
            <p className={`mt-1 text-sm ${paid ? "text-white/60" : "text-muted"}`}>{plan.tagline}</p>
            {paid && user.planRenewsAt ? (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Active until {fmtDate(user.planRenewsAt)}</span>
                  <span className="text-white/60">{daysLeft} days left</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${user.plan === "premium" ? "premium-gradient" : "brand-gradient"}`} style={{ width: `${Math.min(100, ((daysLeft ?? 0) / periodDays) * 100)}%` }} />
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-white/55">
                  <ShieldCheck className="h-3.5 w-3.5" /> Prepaid {user.billingInterval === "month" ? "monthly" : "yearly"} · never auto-renews
                </p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">Free forever. Upgrade any time; everything you saved stays.</p>
            )}
          </div>
        </div>

        <Card className="p-6">
          <SectionTitle title="Usage" hint={paid ? "No limits on your plan" : "Resets daily / monthly"} />
          <div className="space-y-4">
            <Meter label="Saves" used={saveCount(db, user.id)} limit={plan.saveLimit} />
            <Meter label="Questions today" used={asksToday(user)} limit={plan.askPerDay} />
            <Meter label="Collections" used={db.collections.filter((c) => c.userId === user.id).length} limit={plan.collectionLimit} />
            <Meter label="AI plans this month" used={plansThisMonth(db, user.id)} limit={plan.plansPerMonth} />
          </div>
        </Card>
      </div>

      <section>
        <SectionTitle title={paid ? "Renew or switch plan" : "Upgrade"} hint={`Prices in ${currency}. Switching carries your unused time over.`} />
        <div className="grid gap-5 lg:grid-cols-2">
          {(["pro", "premium"] as const).map((p) => {
            const premium = p === "premium";
            const current = user.plan === p;
            return (
              <div key={p} className={`relative flex flex-col rounded-3xl border p-6 ${premium ? "premium-card premium-ring border-amber-300/30" : "brand-ring border-violet-300 bg-white"}`}>
                {current && <span className={`absolute right-5 top-5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${premium ? "bg-white/10 text-amber-200" : "bg-violet-50 text-violet-700"}`}>Your plan</span>}
                <p className={`flex items-center gap-2 text-lg font-semibold ${premium ? "premium-text" : ""}`}>
                  {premium ? <Crown className="h-5 w-5 text-amber-300" /> : <Sparkles className="h-5 w-5 text-brand" />} {PLANS[p].name}
                </p>
                <p className={`text-sm ${premium ? "text-white/60" : "text-muted"}`}>{PLANS[p].tagline}</p>
                <ul className="my-5 grid flex-1 gap-2 sm:grid-cols-2">
                  {PLANS[p].perks.map((perk) => (
                    <li key={perk} className={`flex items-start gap-2 text-sm ${premium ? "text-white/85" : ""}`}>
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${premium ? "text-amber-300" : "text-emerald-500"}`} /> {perk}
                    </li>
                  ))}
                </ul>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-2xl p-4 ${premium ? "bg-white/[0.07] ring-1 ring-amber-300/30" : "bg-violet-50/60 ring-1 ring-violet-200"}`}>
                    <p className={`text-xs font-semibold ${premium ? "text-amber-200" : "text-violet-700"}`}>Yearly · save {yearlySaving(p, currency)}%</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{money(PRICES[p][currency].year, currency)}</p>
                    <p className={`mb-3 text-xs ${premium ? "text-white/55" : "text-muted"}`}>≈ {money(perMonthYearly(p, currency), currency)}/month</p>
                    <CheckoutButton
                      plan={p}
                      interval="year"
                      currency={currency}
                      label={buttonLabel(p, "year")}
                      autoStart={auto?.plan === p && auto.interval === "year" && !current}
                      icon={premium ? <Crown className="h-4 w-4" /> : undefined}
                      className={premium ? "premium-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#3b2304] disabled:opacity-50" : undefined}
                    />
                  </div>
                  <div className={`rounded-2xl p-4 ${premium ? "bg-white/[0.04] ring-1 ring-white/10" : "ring-1 ring-line"}`}>
                    <p className={`text-xs font-semibold ${premium ? "text-white/60" : "text-muted"}`}>Monthly</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{money(PRICES[p][currency].month, currency)}</p>
                    <p className={`mb-3 text-xs ${premium ? "text-white/55" : "text-muted"}`}>per month</p>
                    <CheckoutButton
                      plan={p}
                      interval="month"
                      currency={currency}
                      label={buttonLabel(p, "month")}
                      autoStart={auto?.plan === p && auto.interval === "month" && !current}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50 ${premium ? "bg-white text-ink hover:bg-amber-50" : "bg-ink text-white hover:bg-black"}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">Cards worldwide; UPI, net banking & wallets in India. Payments by Razorpay. Prepaid, never auto-renews, 7-day refund on your first payment.</p>
        {devMode && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Development mode: Razorpay keys aren&apos;t set, so upgrades are applied instantly without payment.</p>}
        {devMode && paid && (
          <div className="mt-3">
            <DowngradeButton />
          </div>
        )}
      </section>

      <Card className="p-6">
        <SectionTitle icon={<Receipt className="h-4 w-4" />} title="Payment history" />
        {payments.length === 0 ? (
          <p className="text-sm text-muted">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
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
                    <td className="py-2.5">
                      {PLANS[p.plan]?.name ?? p.plan} · {p.interval === "year" ? "1 year" : "1 month"}
                    </td>
                    <td className="py-2.5 tabular-nums">{p.provider === "dev" || p.amount === 0 ? <span className="text-muted">Test ({money(0, p.currency ?? "USD")})</span> : money(p.amount / 100, p.currency ?? "USD")}</td>
                    <td className="py-2.5 font-mono text-xs text-muted">{p.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
