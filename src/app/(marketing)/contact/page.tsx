import type { Metadata } from "next";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with the ReelMind team." };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <section className="relative overflow-hidden">
      <div className="hero-glow absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Talk to a <span className="font-display italic brand-text">human.</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">Questions, bugs, a team plan or just an idea: we read every message.</p>
          <div className="mt-10 space-y-5">
            {[
              { icon: Mail, t: "Email", d: process.env.SUPPORT_EMAIL ?? "hello@reelmind.app" },
              { icon: MessageCircle, t: "Instagram", d: `DM @${process.env.NEXT_PUBLIC_IG_BOT_USERNAME ?? "reelmind.ai"} and type “help”` },
              { icon: Clock, t: "Reply time", d: "Within one working day, Mon to Sat" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand shadow-sm ring-1 ring-line">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <ContactForm topic={["support", "billing", "business", "press", "feedback"].includes(topic ?? "") ? topic! : "support"} />
      </div>
    </section>
  );
}
