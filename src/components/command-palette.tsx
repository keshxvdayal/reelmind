"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CornerDownLeft, FileText, Search, Sparkles } from "lucide-react";

type Hit = { id: string; title: string; emoji: string; section: string; subtitle: string };
type Row = { key: string; label: string; hint: string; icon: React.ReactNode; go: () => void };

const PAGES: [string, string, string][] = [
  ["Home", "/app", "🏠"],
  ["Ask ReelMind", "/app/ask", "💬"],
  ["Planner", "/app/planner", "🗓️"],
  ["All saves", "/app/library", "📚"],
  ["Collections", "/app/collections", "💜"],
  ["Try list", "/app/todo", "✅"],
  ["Reminders", "/app/reminders", "🔔"],
  ["Places", "/app/places", "📍"],
  ["Creators", "/app/creators", "🎬"],
  ["Insights", "/app/insights", "📈"],
  ["Connect Instagram", "/app/connect", "📨"],
  ["Billing", "/app/billing", "💳"],
  ["Settings", "/app/settings", "⚙️"],
];

export function CommandPalette({ open, onClose, sections }: { open: boolean; onClose: () => void; sections: { slug: string; name: string; emoji: string }[] }) {
  if (!open) return null;
  return <Palette onClose={onClose} sections={sections} />;
}

function Palette({ onClose, sections }: { onClose: () => void; sections: { slug: string; name: string; emoji: string }[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const term = q.trim();
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (!term) return setHits([]);
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal }).catch(() => null);
      if (res?.ok) setHits(((await res.json()) as { hits: Hit[] }).hits);
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const term = q.trim().toLowerCase();
  const rows: Row[] = [
    ...(term ? [{ key: "ask", label: `Ask ReelMind: “${q.trim()}”`, hint: "AI answer", icon: <Sparkles className="h-4 w-4 text-violet-500" />, go: () => go(`/app/ask?q=${encodeURIComponent(q.trim())}`) }] : []),
    ...hits.map((h) => ({ key: h.id, label: h.title, hint: h.subtitle, icon: <span className="text-base">{h.emoji}</span>, go: () => go(`/app/saves/${h.id}`) })),
    ...sections
      .filter((s) => !term || s.name.toLowerCase().includes(term))
      .slice(0, term ? 4 : 0)
      .map((s) => ({ key: `s-${s.slug}`, label: s.name, hint: "Section", icon: <span className="text-base">{s.emoji}</span>, go: () => go(`/app/sections/${s.slug}`) })),
    ...PAGES.filter(([l]) => !term || l.toLowerCase().includes(term))
      .slice(0, term ? 4 : 13)
      .map(([l, href, e]) => ({ key: href, label: l, hint: "Page", icon: <span className="text-base">{e}</span>, go: () => go(href) })),
  ];
  const current = Math.min(active, Math.max(rows.length - 1, 0));

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="rise relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive(Math.min(current + 1, rows.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive(Math.max(current - 1, 0));
              } else if (e.key === "Enter") rows[current]?.go();
            }}
            placeholder="Search saves, places, pages… or ask anything"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70"
          />
          <kbd className="rounded-md bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {rows.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">Nothing found. Press Enter to ask the AI.</p>}
          {rows.map((r, i) => (
            <button
              key={r.key}
              onMouseEnter={() => setActive(i)}
              onClick={r.go}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${i === current ? "bg-brand-soft" : ""}`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-canvas">{r.icon}</span>
              <span className="min-w-0 flex-1 truncate">{r.label}</span>
              <span className="shrink-0 text-xs text-muted">{r.hint}</span>
              {i === current ? <CornerDownLeft className="h-3.5 w-3.5 text-muted" /> : <ArrowRight className="h-3.5 w-3.5 text-transparent" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-line bg-canvas px-4 py-2 text-[11px] text-muted">
          <FileText className="h-3.5 w-3.5" /> ↑↓ to move · Enter to open · ⌘K to toggle
        </div>
      </div>
    </div>
  );
}
