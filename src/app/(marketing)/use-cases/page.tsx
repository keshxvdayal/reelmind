import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { CtaBand, MarketingHero } from "@/components/marketing";
import { btn } from "@/components/ui";
import { USE_CASES } from "@/lib/use-cases";

export const metadata: Metadata = { title: "Use cases", description: "Trips, workouts, recipes, money, learning and more: what people do with ReelMind." };

export default function UseCasesPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Use cases"
        title={
          <>
            One app for <span className="font-display italic brand-text">everything</span> you save
          </>
        }
        subtitle="People save reels for a hundred reasons. ReelMind makes each kind useful in its own way."
      >
        <Link href="/signup" className={btn.brand}>
          Start free <ArrowRight className="h-4 w-4" />
        </Link>
      </MarketingHero>
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-20">
        {USE_CASES.map((u, i) => (
          <section key={u.slug} id={u.slug} className="scroll-mt-24 grid gap-8 rounded-[2rem] border border-line bg-white p-7 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
            <div className={i % 2 ? "lg:order-2" : ""}>
              <span className="text-4xl">{u.emoji}</span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{u.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{u.body}</p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-3">
                {u.gets.map((g) => (
                  <li key={g} className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {g}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hero-glow space-y-2.5 rounded-3xl border border-line bg-canvas p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Try asking</p>
              {u.asks.map((a) => (
                <p key={a} className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-line">
                  <Sparkles className="h-4 w-4 shrink-0 text-violet-500" /> {a}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <CtaBand />
    </>
  );
}
