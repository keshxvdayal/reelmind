"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { btn, input } from "@/components/ui";

export function AuthForm({ mode, demoHint, next }: { mode: "login" | "signup"; demoHint?: boolean; next?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    if (!res.ok) {
      setBusy(false);
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong.");
      return;
    }
    router.push(next ?? (mode === "signup" ? "/app/connect" : "/app"));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "signup" && (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Your name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Email</span>
        <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Password</span>
        <input className={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} required />
      </label>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button disabled={busy} className={`${btn.brand} w-full py-3`}>
        {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} {mode === "signup" ? "Create account" : "Log in"}
      </button>
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>Already have an account? <Link className="font-medium text-brand" href="/login">Log in</Link></>
        ) : (
          <>New here? <Link className="font-medium text-brand" href="/signup">Create an account</Link></>
        )}
      </p>
      {demoHint && mode === "login" && (
        <button
          type="button"
          onClick={() => {
            setEmail("demo@reelmind.app");
            setPassword("demo1234");
          }}
          className="w-full rounded-xl border border-dashed border-violet-300 bg-violet-50/50 px-3 py-2 text-sm text-violet-700"
        >
          Fill in the demo account (demo@reelmind.app)
        </button>
      )}
    </form>
  );
}
