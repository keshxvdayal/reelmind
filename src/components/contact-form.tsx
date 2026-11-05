"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { btn, input } from "@/components/ui";

export function ContactForm({ topic: initialTopic }: { topic: string }) {
  const [form, setForm] = useState({ name: "", email: "", topic: initialTopic, message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setBusy(false);
    if (!res.ok) setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not send. Try again.");
    else setSent(true);
  }

  if (sent)
    return (
      <div className="rise rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="mt-3 text-lg font-semibold">Thanks, we got it!</p>
        <p className="mt-1 text-sm text-muted">We usually reply within one working day.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-white p-6 shadow-xl shadow-violet-900/5 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Name</span>
          <input className={input} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <input className={input} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">What&apos;s it about?</span>
        <select className={input} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
          <option value="support">Help with my account</option>
          <option value="billing">Billing & refunds</option>
          <option value="business">Business / team plan</option>
          <option value="press">Press & partnerships</option>
          <option value="feedback">Feedback & ideas</option>
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Message</span>
        <textarea className={`${input} min-h-36`} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </label>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button disabled={busy} className={`${btn.brand} w-full py-3`}>
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send message
      </button>
    </form>
  );
}
