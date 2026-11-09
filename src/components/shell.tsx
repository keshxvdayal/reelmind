"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarRange,
  ChevronDown,
  Crown,
  CreditCard,
  FolderHeart,
  FolderTree,
  House,
  LifeBuoy,
  Library,
  LineChart,
  ListChecks,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Newspaper,
  Search,
  Send,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AddSave } from "@/components/add-save";
import { CommandPalette } from "@/components/command-palette";
import { Logo, PlanPill, Progress } from "@/components/ui";

type NavSection = { slug: string; name: string; emoji: string; count: number };

export type ShellProps = {
  user: { name: string; email: string; plan: "free" | "pro" | "premium" };
  sections: NavSection[];
  linked: boolean;
  pending: number;
  total: number;
  saveLimit: number | null;
  badges: { todos: number; reminders: number };
  children: React.ReactNode;
};

export function Shell({ user, sections, linked, pending, total, saveLimit, badges, children }: ShellProps) {
  const path = usePathname();
  const router = useRouter();
  // The mobile menu is open only on the page where it was opened, so navigating closes it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const setOpen = (v: boolean) => setOpenAt(v ? path : null);
  const [palette, setPalette] = useState(false);
  const [showSections, setShowSections] = useState(true);
  useLiveRefresh(pending, total);
  useTimeZoneCookie();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups: { title?: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; premium?: boolean }[] }[] = [
    {
      items: [
        { href: "/app", label: "Home", icon: House },
        { href: "/app/ask", label: "Ask ReelMind", icon: MessageCircle },
        { href: "/app/planner", label: "Planner", icon: CalendarRange },
        { href: "/app/digest", label: "Weekly digest", icon: Newspaper, premium: user.plan !== "premium" },
      ],
    },
    {
      title: "Library",
      items: [
        { href: "/app/library", label: "All saves", icon: Library },
        { href: "/app/collections", label: "Collections", icon: FolderHeart },
        { href: "/app/todo", label: "Try list", icon: ListChecks, badge: badges.todos },
        { href: "/app/reminders", label: "Reminders", icon: Bell, badge: badges.reminders },
      ],
    },
    {
      title: "Explore",
      items: [
        { href: "/app/places", label: "Places", icon: MapPin },
        { href: "/app/creators", label: "Creators", icon: Users },
        { href: "/app/insights", label: "Insights", icon: LineChart },
      ],
    },
  ];
  const isActive = (href: string) => (href === "/app" ? path === "/app" : path === href || path.startsWith(`${href}/`));
  const link = (active: boolean) =>
    `group flex items-center gap-3 rounded-xl px-3 py-[7px] text-[13.5px] transition ${active ? "bg-white font-medium text-ink shadow-sm ring-1 ring-line" : "text-ink/65 hover:bg-white/70 hover:text-ink"}`;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-4">
      <div className="px-2 pt-1">
        <Logo href="/app" />
      </div>
      <button onClick={() => setPalette(true)} className="mx-1 flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] text-muted shadow-sm transition hover:border-violet-200">
        <Search className="h-3.5 w-3.5" /> Search
        <kbd className="ml-auto rounded-md bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">⌘K</kbd>
      </button>
      {groups.map((g, i) => (
        <div key={i}>
          {g.title && <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/80">{g.title}</p>}
          <div className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon, badge, premium }) => (
              <Link key={href} href={href} className={link(isActive(href))}>
                <Icon className={`h-4 w-4 ${isActive(href) ? "text-brand" : ""}`} /> {label}
                {badge ? <span className="ml-auto rounded-full bg-violet-100 px-1.5 text-[11px] font-semibold text-violet-700">{badge}</span> : null}
                {premium ? <Crown className="ml-auto h-3.5 w-3.5 text-amber-500" aria-label="Premium" /> : null}
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div>
        <button onClick={() => setShowSections((v) => !v)} className="mb-1 flex w-full items-center px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/80">
          Sections <ChevronDown className={`ml-auto h-3.5 w-3.5 transition ${showSections ? "" : "-rotate-90"}`} />
        </button>
        {showSections && (
          <div className="space-y-0.5">
            {sections.length === 0 && <p className="px-3 text-xs text-muted">AI creates sections as you save.</p>}
            {sections.slice(0, 8).map((s) => {
              const href = `/app/sections/${s.slug}`;
              return (
                <Link key={s.slug} href={href} className={link(path === href)}>
                  <span className="w-4 text-center text-[13px]">{s.emoji}</span>
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-[11px] text-muted">{s.count}</span>
                </Link>
              );
            })}
            <Link href="/app/sections" className={link(path === "/app/sections")}>
              <FolderTree className="h-4 w-4" /> All sections
            </Link>
          </div>
        )}
      </div>

      <div className="mt-auto space-y-3">
        {user.plan === "pro" && (
          <Link href="/app/billing" className="premium-card group block overflow-hidden rounded-2xl p-3.5 transition hover:brightness-110">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
              <Crown className="h-3.5 w-3.5" /> Go Premium
            </p>
            <p className="mt-1 text-[11.5px] leading-snug text-white/65">Weekly digest, habit streaks & calendar sync.</p>
          </Link>
        )}
        {user.plan === "free" && saveLimit && (
          <Link href="/app/billing" className="block rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-3.5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold">Free plan</span>
              <span className="text-muted">
                {total}/{saveLimit} saves
              </span>
            </div>
            <Progress value={total} max={saveLimit} />
            <p className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-brand">
              <Sparkles className="h-3.5 w-3.5" /> Upgrade to Pro
            </p>
          </Link>
        )}
        <div className="space-y-0.5">
          <Link href="/app/connect" className={link(isActive("/app/connect"))}>
            <Send className="h-4 w-4" /> Instagram
            <span className={`ml-auto h-2 w-2 rounded-full ${linked ? "bg-emerald-500" : "bg-amber-400"}`} title={linked ? "Connected" : "Not connected"} />
          </Link>
          <Link href="/app/billing" className={link(isActive("/app/billing"))}>
            <CreditCard className="h-4 w-4" /> Billing
            <PlanPill plan={user.plan} className="ml-auto" />
          </Link>
          <Link href="/app/settings" className={link(isActive("/app/settings"))}>
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <Link href="/help" className={link(false)}>
            <LifeBuoy className="h-4 w-4" /> Help
          </Link>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold text-white ${user.plan === "premium" ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-canvas" : ""}`}>
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-rose-600" aria-label="Log out" title="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-[260px] print:pl-0">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] border-r border-line bg-canvas lg:block print:hidden">{nav}</aside>

      <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-10">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-canvas lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Logo href="/app" />
          </div>
          <button
            onClick={() => setPalette(true)}
            className="ml-auto hidden w-full max-w-md items-center gap-2 rounded-xl border border-line bg-canvas px-3.5 py-2 text-left text-sm text-muted transition hover:border-violet-200 sm:flex lg:ml-0"
          >
            <Search className="h-4 w-4" /> Search saves, places, sections…
            <kbd className="ml-auto rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] ring-1 ring-line">⌘K</kbd>
          </button>
          <button onClick={() => setPalette(true)} className="ml-auto rounded-lg p-2 hover:bg-canvas sm:hidden" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          <div className="sm:ml-auto">
            <AddSave compact />
          </div>
        </div>
        {pending > 0 && (
          <div className="border-t border-violet-100 bg-violet-50 px-6 py-1.5 text-center text-xs text-violet-700">
            ✨ Sorting {pending} new save{pending === 1 ? "" : "s"}… this page updates by itself.
          </div>
        )}
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-canvas shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-2 hover:bg-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <CommandPalette open={palette} onClose={() => setPalette(false)} sections={sections} />
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}

/**
 * Saves arrive from Instagram at any time. Poll the cheap status endpoint
 * (fast while something is being sorted) and refresh when anything changed.
 */
function useLiveRefresh(pending: number, total: number) {
  const router = useRouter();
  const last = useRef(`${pending}/${total}`);
  useEffect(() => {
    last.current = `${pending}/${total}`;
    const t = setInterval(async () => {
      if (document.hidden) return;
      const res = await fetch("/api/status").catch(() => null);
      if (!res?.ok) return;
      const s = (await res.json()) as { pending: number; total: number };
      const now = `${s.pending}/${s.total}`;
      if (now !== last.current) {
        last.current = now;
        router.refresh();
      }
    }, pending > 0 ? 2500 : 15000);
    return () => clearInterval(t);
  }, [pending, total, router]);
}

/** Tell the server the browser's time zone, so greetings and day boundaries match the user's clock. */
function useTimeZoneCookie() {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const current = document.cookie.match(/(?:^|; )rm_tz=([^;]*)/)?.[1];
    if (current && decodeURIComponent(current) === tz) return;
    document.cookie = `rm_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);
}
