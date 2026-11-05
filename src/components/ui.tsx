import Link from "next/link";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span className="brand-gradient relative grid shrink-0 place-items-center rounded-[30%] text-white shadow-sm" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.56, height: size * 0.56 }}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="2" />
        <path d="M10 8.8v6.4l5.2-3.2L10 8.8Z" fill="currentColor" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", size = "md", tone = "dark" }: { href?: string; size?: "md" | "lg"; tone?: "dark" | "light" }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark size={size === "lg" ? 40 : 32} />
      <span className={`font-semibold tracking-tight ${size === "lg" ? "text-xl" : "text-[17px]"} ${tone === "light" ? "text-white" : ""}`}>ReelMind</span>
    </Link>
  );
}

/** Stable hue per section, so a section keeps its colour everywhere. */
export function hueFor(key: string): number {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

export function tileStyle(key: string): React.CSSProperties {
  const h = hueFor(key);
  return { background: `linear-gradient(140deg, hsl(${h} 85% 94%) 0%, hsl(${(h + 40) % 360} 80% 87%) 100%)` };
}

export function chipStyle(key: string): React.CSSProperties {
  const h = hueFor(key);
  return { background: `hsl(${h} 80% 95%)`, color: `hsl(${h} 55% 32%)` };
}

export function dotStyle(key: string): React.CSSProperties {
  return { background: `hsl(${hueFor(key)} 70% 60%)` };
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:opacity-50",
  brand:
    "brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-fuchsia-500/20 transition hover:opacity-95 hover:shadow-md disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition hover:border-violet-200 hover:bg-violet-50/40 disabled:opacity-50",
  subtle:
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition hover:bg-brand-soft hover:text-brand disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50",
};

export const input =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`soft-shadow rounded-2xl border border-line bg-white ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, action, eyebrow }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>}
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({ icon, title, hint, action }: { icon?: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-violet-500">{icon}</span>}
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {hint && <span className="hidden text-xs text-muted sm:inline">{hint}</span>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, children, action }: { icon: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-violet-200 bg-white/70 px-6 py-14 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon && <span className="text-violet-400">{icon}</span>}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export function Badge({ children, tone = "violet" }: { children: React.ReactNode; tone?: "violet" | "green" | "amber" | "gray" | "rose" }) {
  const tones = {
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    gray: "bg-canvas text-muted ring-line",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

export function Progress({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
      <div className="brand-gradient h-full rounded-full transition-all" style={{ width: `${Math.min(100, max ? (value / max) * 100 : 0)}%` }} />
    </div>
  );
}
