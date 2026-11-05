import { CheckCircle2, Search, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/ui";

/** Illustrations built from HTML, so they stay crisp and on-brand. */
export function PhoneDm() {
  return (
    <div className="relative mx-auto w-[280px] rounded-[2.6rem] border-[10px] border-night bg-white shadow-2xl shadow-violet-900/30">
      <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-night" />
      <div className="flex items-center gap-2.5 border-b border-line px-4 pb-3 pt-9">
        <LogoMark size={30} />
        <div className="leading-tight">
          <p className="text-[13px] font-semibold">reelmind.ai</p>
          <p className="text-[10px] text-muted">Your saves assistant</p>
        </div>
      </div>
      <div className="space-y-2.5 px-3 py-4 text-[12px]">
        <div className="ml-auto w-[78%] overflow-hidden rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
          <div className="grid h-28 place-items-center bg-[linear-gradient(160deg,#fde68a,#fb7185_60%,#7c3aed)] text-4xl">🏝️</div>
          <p className="px-3 py-2 text-[11px] leading-snug">@wanderwithriya · 5 hidden beaches in South Goa 🌊</p>
        </div>
        <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-violet-600 px-3 py-1.5 text-white">for december trip</p>
        <div className="w-[85%] rounded-2xl rounded-bl-md bg-canvas px-3 py-2 leading-snug">
          Saved to <b>✈️ Travel → Goa</b>: 5 hidden beaches in South Goa ✓
        </div>
        <p className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-violet-600 px-3 py-1.5 text-white">what cafés did I save in goa?</p>
        <div className="w-[88%] rounded-2xl rounded-bl-md bg-canvas px-3 py-2 leading-snug">
          You saved 3: Artjuna in Anjuna, Bean Me Up in Vagator and Café Bodega in Panjim. Want a route for one day?
        </div>
      </div>
    </div>
  );
}

export function DashboardMock() {
  const sections = [
    ["✈️", "Travel", 42, 262],
    ["💪", "Fitness", 27, 150],
    ["🍳", "Food & Recipes", 58, 28],
    ["🧠", "Mind & Emotions", 19, 200],
    ["💰", "Money", 14, 130],
    ["🚀", "Career", 22, 320],
  ] as const;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-2xl shadow-violet-900/15">
      <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 rounded-md bg-white px-3 py-0.5 text-[10px] text-muted ring-1 ring-line">reelmind.app/app</span>
      </div>
      <div className="grid grid-cols-[120px_1fr] text-[11px]">
        <div className="space-y-1 border-r border-line p-3">
          {["Home", "Ask", "Library", "Collections", "Planner", "Try list", "Places", "Insights"].map((n, i) => (
            <p key={n} className={`rounded-md px-2 py-1 ${i === 0 ? "bg-brand-soft font-medium text-brand" : "text-ink/60"}`}>
              {n}
            </p>
          ))}
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[15px] font-semibold">Hey Riya, what are you looking for?</p>
          <div className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-muted">
            <Search className="h-3 w-3" /> plan my goa trip from my saves
            <span className="brand-gradient ml-auto rounded-md px-2 py-0.5 text-white">Ask</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sections.map(([e, n, c, h]) => (
              <div key={n} className="rounded-lg p-2" style={{ background: `linear-gradient(140deg, hsl(${h} 85% 94%), hsl(${(h + 40) % 360} 80% 87%))` }}>
                <p className="text-base">{e}</p>
                <p className="mt-2 truncate font-medium">{n}</p>
                <p className="text-[10px] text-ink/50">{c} saves</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnswerMock() {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white p-5 text-sm shadow-xl shadow-violet-900/10">
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-white">remember a travel reel from like 4 months ago? want to plan a trip</p>
      <div className="flex gap-2.5">
        <span className="brand-gradient grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="space-y-2 leading-relaxed">
          <p>
            Found it. On <b>July 12</b> you saved{" "}
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[12px] font-medium text-violet-700 ring-1 ring-violet-200">✈️ 3 days in Pondicherry under ₹8k</span>, plus 4 more beach trips since.
          </p>
          <p className="font-semibold">Your 3-day plan</p>
          <ul className="ml-4 list-disc space-y-0.5 text-ink/80 marker:text-violet-400">
            <li>Day 1 · French Quarter walk, Café des Arts</li>
            <li>Day 2 · Paradise Beach and Auroville</li>
            <li>Day 3 · Sunrise at Serenity Beach</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function TryListMock() {
  const rows: [string, boolean][] = [
    ["Try the 15-min mobility flow", true],
    ["Cook one-pot paneer pulao", false],
    ["Book Artjuna café, Anjuna", false],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([t, d]) => (
        <div key={t} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-[13px] ring-1 ring-line">
          {d ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-4 w-4 rounded-full border-2 border-violet-300" />}
          <span className={d ? "text-muted line-through" : ""}>{t}</span>
        </div>
      ))}
    </div>
  );
}
