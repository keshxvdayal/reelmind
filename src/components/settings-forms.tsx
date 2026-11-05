"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Download, LoaderCircle, Lock } from "lucide-react";
import { btn, Card, input } from "@/components/ui";
import { call } from "@/lib/client-api";
import type { UserPrefs } from "@/lib/types";

function Saved({ show }: { show: boolean }) {
  return show ? (
    <span className="rise inline-flex items-center gap-1 text-sm text-emerald-600">
      <Check className="h-4 w-4" /> Saved
    </span>
  ) : null;
}

export function ProfileForm({ name: n0, email: e0 }: { name: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(n0);
  const [email, setEmail] = useState(e0);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await call("/api/settings", "PATCH", { name, email });
        setBusy(false);
        if (!r.ok) return setError(r.error);
        setOk(true);
        setTimeout(() => setOk(false), 2000);
        router.refresh();
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="flex items-center gap-3">
        <button className={btn.primary} disabled={busy || (name === n0 && email === e0)}>
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Save changes
        </button>
        <Saved show={ok} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await call("/api/settings/password", "POST", { current, next });
        setBusy(false);
        if (!r.ok) return setError(r.error);
        setCurrent("");
        setNext("");
        setOk(true);
        setTimeout(() => setOk(false), 2000);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Current password</span>
          <input className={input} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">New password</span>
          <input className={input} type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
        </label>
      </div>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="flex items-center gap-3">
        <button className={btn.ghost} disabled={busy || !current || next.length < 8}>
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Change password
        </button>
        <Saved show={ok} />
      </div>
    </form>
  );
}

const PREF_LABELS: [keyof UserPrefs, string, string, boolean][] = [
  ["dmConfirmations", "Confirm each save in DMs", "The bot replies “Saved to ✈️ Travel” after every share.", false],
  ["dmAnswers", "Answer questions in DMs", "Text the bot a question and get an answer with links.", true],
  ["reminderDms", "Send reminders to my DMs", "Due reminders arrive as an Instagram message.", true],
  ["rediscover", "Resurface forgotten saves", "Show “Remember these?” on your home page.", false],
];

export function PrefsForm({ prefs, pro }: { prefs: UserPrefs; pro: boolean }) {
  const router = useRouter();
  const [p, setP] = useState(prefs);
  async function flip(k: keyof UserPrefs) {
    const next = { ...p, [k]: !p[k] };
    setP(next);
    await call("/api/settings", "PATCH", { prefs: { [k]: next[k] } });
    router.refresh();
  }
  return (
    <div className="divide-y divide-line">
      {PREF_LABELS.map(([k, label, hint, proOnly]) => (
        <div key={k} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {label}{" "}
              {proOnly && !pro && (
                <Link href="/app/billing" className="ml-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200">
                  PRO
                </Link>
              )}
            </p>
            <p className="text-xs text-muted">{hint}</p>
          </div>
          <button role="switch" aria-checked={p[k]} onClick={() => flip(k)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${p[k] ? "bg-violet-600" : "bg-line"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${p[k] ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ExportButtons({ pro }: { pro: boolean }) {
  if (!pro)
    return (
      <Link href="/app/billing" className={btn.ghost}>
        <Lock className="h-4 w-4" /> Export is part of Pro
      </Link>
    );
  return (
    <div className="flex flex-wrap gap-2">
      <a href="/api/export?format=csv" className={btn.ghost}>
        <Download className="h-4 w-4" /> Download CSV
      </a>
      <a href="/api/export?format=json" className={btn.ghost}>
        <Download className="h-4 w-4" /> Download JSON
      </a>
    </div>
  );
}

export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card className="border-rose-200 p-6">
      <p className="font-semibold text-rose-700">Delete account</p>
      <p className="mt-1 text-sm text-muted">Permanently delete your account, every save, collection, plan and conversation. This can&apos;t be undone.</p>
      {open ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const r = await call("/api/account", "DELETE", { password });
            setBusy(false);
            if (!r.ok) return setError(r.error);
            router.push("/");
            router.refresh();
          }}
          className="mt-4 flex flex-wrap gap-2"
        >
          <input className={`${input} max-w-xs`} type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          <button className={btn.danger} disabled={!password || busy}>
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Delete forever
          </button>
          <button type="button" className={btn.ghost} onClick={() => setOpen(false)}>
            Cancel
          </button>
          {error && <p className="w-full text-sm text-rose-600">{error}</p>}
        </form>
      ) : (
        <button onClick={() => setOpen(true)} className={`${btn.danger} mt-4`}>
          Delete my account
        </button>
      )}
    </Card>
  );
}
