"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Crown, Sparkles, Users } from "lucide-react";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { btn } from "@/components/ui";
import { money, perMonthYearly, PLANS, PRICES, yearlySaving } from "@/lib/plans";
import type { Currency, PaidPlan } from "@/lib/types";

/** Free / Pro / Premium cards with a billing-interval toggle and currency picker. */
export function PricingTable({ currency, compact = false }: { currency: Currency; compact?: boolean }) {
  const [yearly, setYearly] = useState(true);
  const interval = yearly ? "year" : "month";
  const paid = (plan: PaidPlan) => ({
    price: money(yearly ? perMonthYearly(plan, currency) : PRICES[plan][currency].month, currency),
    note: yearly ? `${money(PRICES[plan][currency].year, currency)} billed yearly · save ${yearlySaving(plan, currency)}%` : "Billed monthly · no auto-renewal",
  });
  const pro = paid("pro");
  const premium = paid("premium");

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
        <div className="flex w-fit items-center gap-1 rounded-full border border-line bg-white p-1 text-sm shadow-sm" role="group" aria-label="Billing period">
          <button onClick={() => setYearly(false)} aria-pressed={!yearly} className={`rounded-full px-4 py-1.5 font-medium transition ${!yearly ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
            Monthly
          </button>
          <button onClick={() => setYearly(true)} aria-pressed={yearly} className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-medium transition ${yearly ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
            Yearly <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">−{yearlySaving("pro", currency)}%</span>
          </button>
        </div>
        <CurrencySwitcher value={currency} />
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        <Tier
          name={PLANS.free.name}
          tagline={PLANS.free.tagline}
          price={money(0, currency)}
          per="forever"
          note="No card needed"
          perks={PLANS.free.perks}
          compact={compact}
          cta={
            <Link href="/signup" className={`${btn.ghost} w-full py-2.5`}>
              Start free
            </Link>
          }
        />
        <Tier
          highlight
          icon={<Sparkles className="h-4 w-4" />}
          name={PLANS.pro.name}
          tagline={PLANS.pro.tagline}
          price={pro.price}
          per="/ month"
          note={pro.note}
          perks={PLANS.pro.perks}
          compact={compact}
          cta={
            <Link href={`/signup?plan=pro&interval=${interval}`} className={`${btn.brand} w-full py-2.5`}>
              Get Pro <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <Tier
          premium
          icon={<Crown className="h-4 w-4" />}
          name={PLANS.premium.name}
          tagline={PLANS.premium.tagline}
          price={premium.price}
          per="/ month"
          note={premium.note}
          perks={PLANS.premium.perks}
          soon={PLANS.premium.soon}
          compact={compact}
          cta={
            <Link href={`/signup?plan=premium&interval=${interval}`} className="premium-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#3b2304] shadow-lg shadow-amber-500/20 transition hover:opacity-95">
              Get Premium <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-line bg-white p-6 sm:flex-row">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Teams, agencies & creators</p>
            <p className="text-sm text-muted">Shared swipe files, brand boards, invoices with VAT/GST and volume pricing in any currency.</p>
          </div>
        </div>
        <Link href="/contact?topic=business" className={`${btn.primary} shrink-0`}>
          Talk to us
        </Link>
      </div>
    </div>
  );
}

function Tier({
  name,
  tagline,
  price,
  per,
  note,
  perks,
  soon,
  cta,
  icon,
  highlight,
  premium,
  compact,
}: {
  name: string;
  tagline: string;
  price: string;
  per: string;
  note?: string;
  perks: string[];
  soon?: string[];
  cta: React.ReactNode;
  icon?: React.ReactNode;
  highlight?: boolean;
  premium?: boolean;
  compact?: boolean;
}) {
  const dark = premium;
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-7 transition ${
        dark ? "premium-card premium-ring border-amber-300/30" : highlight ? "brand-ring border-violet-300 bg-white lg:-translate-y-2" : "border-line bg-white"
      }`}
    >
      {highlight && <span className="brand-gradient absolute -top-3 left-7 rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-md">Most popular</span>}
      {premium && <span className="premium-gradient absolute -top-3 left-7 rounded-full px-3 py-1 text-[11px] font-semibold text-[#3b2304] shadow-md">Best value for power users</span>}
      <div className="flex items-center gap-2">
        {icon && <span className={`grid h-7 w-7 place-items-center rounded-lg ${dark ? "bg-white/10 text-amber-300" : "bg-brand-soft text-brand"}`}>{icon}</span>}
        <p className={`text-lg font-semibold ${dark ? "premium-text" : ""}`}>{name}</p>
      </div>
      <p className={`mt-1 text-sm ${dark ? "text-white/60" : "text-muted"}`}>{tagline}</p>
      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="text-[44px] font-semibold leading-none tracking-tight tabular-nums">{price}</span>
        <span className={`text-base ${dark ? "text-white/55" : "text-muted"}`}>{per}</span>
      </p>
      <p className={`mt-2 min-h-5 text-xs ${dark ? "text-white/55" : "text-muted"}`}>{note}</p>
      <div className="mt-5">{cta}</div>
      <ul className={`mt-7 space-y-3 border-t pt-6 ${dark ? "border-white/10" : "border-line"} ${compact ? "flex-1" : ""}`}>
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-amber-300" : "text-emerald-500"}`} /> <span className={dark ? "text-white/85" : ""}>{p}</span>
          </li>
        ))}
        {soon?.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm text-white/50">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" /> {p}
            <span className="ml-auto shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Soon</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
