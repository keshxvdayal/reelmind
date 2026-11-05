import Link from "next/link";
import { ArrowRight, ChevronDown, Menu } from "lucide-react";
import { btn, Logo } from "@/components/ui";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/help", label: "Help" },
  { href: "/about", label: "About" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-ink/70 transition hover:bg-canvas hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/app" className={btn.primary}>
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className={`${btn.subtle} hidden sm:inline-flex`}>
                Log in
              </Link>
              <Link href="/signup" className={btn.primary}>
                Start free
              </Link>
            </>
          )}
          <details className="relative md:hidden">
            <summary className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-white" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-line bg-white p-2 shadow-xl">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas">
                  {n.label}
                </Link>
              ))}
              {!signedIn && (
                <Link href="/login" className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas">
                  Log in
                </Link>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const cols = [
    { title: "Product", links: [["Features", "/features"], ["Pricing", "/pricing"], ["Use cases", "/use-cases"], ["Start free", "/signup"]] },
    { title: "Company", links: [["About", "/about"], ["Contact", "/contact"], ["Help centre", "/help"]] },
    { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
  ];
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">The second brain for everything you save on Instagram. Made in India for people who save too much and remember too little.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{c.title}</p>
            <ul className="space-y-2">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink/75 transition hover:text-brand">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-muted">
          <p>© {new Date().getFullYear()} ReelMind. All rights reserved.</p>
          <p>Not affiliated with, endorsed or sponsored by Instagram or Meta.</p>
        </div>
      </div>
    </footer>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{children}</p>;
}

export function MarketingHero({ eyebrow, title, subtitle, children }: { eyebrow: string; title: React.ReactNode; subtitle: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-white">
      <div className="hero-glow absolute inset-0" />
      <div className="grid-bg absolute inset-0" />
      <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:py-24">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-[56px]">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">{subtitle}</p>
        {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="px-5 py-20">
      <div className="night relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white sm:px-12">
        <div className="brand-gradient absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl" />
        <div className="brand-gradient absolute -bottom-32 -left-20 h-72 w-72 rounded-full opacity-25 blur-3xl" />
        <h2 className="relative text-3xl font-semibold tracking-tight sm:text-5xl">
          Stop saving reels <span className="font-display italic text-fuchsia-300">into the void.</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/70">Connect Instagram in under a minute. Your first 50 saves are free, forever.</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-violet-50">
            Create free account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Faq({ items }: { items: [string, string][] }) {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map(([q, a]) => (
        <details key={q} className="group px-5 py-4">
          <summary className="flex cursor-pointer items-center justify-between gap-4 text-[15px] font-medium">
            {q}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}

export const FAQ: [string, string][] = [
  ["Do I need to give you my Instagram password?", "Never. You connect by sending a one-time code to our bot account in a DM. We only see what you choose to share with the bot."],
  ["How do I save a reel?", "On any reel or post, tap the paper-plane Share button and send it to our bot, exactly like sending it to a friend. Add a note in the message if you want. It shows up in your dashboard, sorted, within seconds."],
  ["What does the AI actually do with a save?", "It reads the caption, creator and image, then writes a title, a summary, the key points (steps, places, ingredients, exercises), action items and search tags, and files it into a section of your life like Travel or Fitness."],
  ["Can I ask about something I saved months ago?", "Yes, that is the whole point. Ask things like “that café reel I saved in summer” or “plan a 3-day Goa trip from my saves”. ReelMind searches everything you saved and answers with links to the exact saves."],
  ["Does it work with Hinglish captions?", "Yes. Captions in Hindi, Hinglish and most other languages are understood, and you can ask questions in Hinglish too."],
  ["What happens when my Pro period ends?", "You keep everything you saved. Pro never auto-renews; if you do not renew, you go back to the Free plan limits for new saves and questions, and nothing is deleted."],
  ["Can I export my data?", "Yes. Settings → Export gives you all your saves as CSV or JSON at any time."],
];
