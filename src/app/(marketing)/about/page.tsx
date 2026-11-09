import type { Metadata } from "next";
import { CtaBand, MarketingHero } from "@/components/marketing";

export const metadata: Metadata = { title: "About", description: "Why we built ReelMind." };

export default function AboutPage() {
  return (
    <>
      <MarketingHero
        eyebrow="About us"
        title={
          <>
            We save too much and <span className="font-display italic brand-text">remember too little.</span>
          </>
        }
        subtitle="ReelMind started with a simple frustration: a saved folder full of trips we never took, recipes we never cooked and advice we never found again."
      />
      <section className="mx-auto max-w-3xl space-y-6 px-5 py-20 text-lg leading-relaxed text-ink/80">
        <p>
          Instagram is where a lot of us learn now. A travel creator shows you a beach you didn&apos;t know existed. A physio shows you the stretch that fixes your back. A stranger writes the exact thing you
          needed to hear. You tap save, because you&apos;ll need it later.
        </p>
        <p>
          Later never comes. The saved tab has no search, no folders that sort themselves, no way to ask &ldquo;what was that thing about…&rdquo;. So the good stuff sinks under everything else.
        </p>
        <p>
          ReelMind is the missing half of saving. You share a reel to our bot, and AI reads it, writes down what matters and files it where you&apos;d look for it. Months later you ask a vague question
          and get the exact save back, or a plan built from ten of them.
        </p>
        <div className="grid gap-4 pt-6 sm:grid-cols-3">
          {[
            ["Useful over clever", "Every feature has to turn saves into something you do."],
            ["Private by default", "Your library is yours. No ads, no selling data, ever."],
            ["Made for everyone", "Captions in any language, local currencies and payment methods worldwide."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line bg-canvas p-5">
              <p className="text-base font-semibold text-ink">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
