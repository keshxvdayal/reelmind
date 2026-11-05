"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { btn } from "@/components/ui";
import type { PlanInfo } from "@/lib/plans";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function PricingTable({ free, pro, saving }: { free: PlanInfo; pro: PlanInfo; saving: number }) {
  const [yearly, setYearly] = useState(true);
  const proPrice = yearly ? Math.round(pro.yearly / 12) : pro.monthly;
  return (
    <div>
      <div className="mx-auto mb-10 flex w-fit items-center gap-1 rounded-full border border-line bg-white p-1 text-sm shadow-sm">
        <button onClick={() => setYearly(false)} className={`rounded-full px-4 py-1.5 font-medium transition ${!yearly ? "bg-ink text-white" : "text-muted"}`}>
          Monthly
        </button>
        <button onClick={() => setYearly(true)} className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-medium transition ${yearly ? "bg-ink text-white" : "text-muted"}`}>
          Yearly <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">−{saving}%</span>
        </button>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Tier name={free.name} tagline={free.tagline} price={inr(0)} per="forever" perks={free.perks} cta={<Link href="/signup" className={`${btn.ghost} w-full py-2.5`}>Start free</Link>} />
        <Tier
          highlight
          name={pro.name}
          tagline={pro.tagline}
          price={inr(proPrice)}
          per="/ month"
          note={yearly ? `${inr(pro.yearly)} billed yearly` : "Prepaid monthly, no auto-renewal"}
          perks={pro.perks}
          cta={
            <Link href={`/signup?plan=pro&interval=${yearly ? "year" : "month"}`} className={`${btn.brand} w-full py-2.5`}>
              Get Pro
            </Link>
          }
        />
        <Tier
          name="Business"
          tagline="For creators, agencies & teams"
          price="Custom"
          per=""
          perks={["Everything in Pro", "Shared team libraries", "Swipe files for content teams", "Brand & campaign collections", "Priority support", "Invoices with GST"]}
          cta={<Link href="/contact?topic=business" className={`${btn.primary} w-full py-2.5`}>Talk to us</Link>}
        />
      </div>
    </div>
  );
}

function Tier({ name, tagline, price, per, note, perks, cta, highlight }: { name: string; tagline: string; price: string; per: string; note?: string; perks: string[]; cta: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`relative flex flex-col rounded-3xl border bg-white p-7 ${highlight ? "brand-ring border-violet-300" : "border-line"}`}>
      {highlight && <span className="brand-gradient absolute -top-3 left-7 rounded-full px-3 py-1 text-[11px] font-semibold text-white">Most popular</span>}
      <p className="text-lg font-semibold">{name}</p>
      <p className="text-sm text-muted">{tagline}</p>
      <p className="mt-6 text-[44px] font-semibold leading-none tracking-tight">
        {price}
        <span className="text-base font-normal text-muted"> {per}</span>
      </p>
      <p className="mt-2 h-5 text-xs text-muted">{note}</p>
      <div className="mt-5">{cta}</div>
      <ul className="mt-7 space-y-3 border-t border-line pt-6">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
