"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Sparkles, Wand2 } from "lucide-react";
import { Answer, type Catalog } from "@/components/answer";
import { btn, Card, input } from "@/components/ui";
import { readNdjson } from "@/lib/client-api";
import type { TemplateInfo } from "@/lib/planner";
import type { PlanTemplate } from "@/lib/types";

export function Planner({
  templates,
  collections,
  initialCollection,
  catalog,
  aiReady,
  remaining,
}: {
  templates: [PlanTemplate, TemplateInfo][];
  collections: { id: string; name: string; emoji: string }[];
  initialCollection: string | null;
  catalog: Catalog;
  aiReady: boolean;
  remaining: number | null;
}) {
  const router = useRouter();
  const [template, setTemplate] = useState<PlanTemplate>("trip");
  const [request, setRequest] = useState("");
  const [collection, setCollection] = useState(initialCollection ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const t = templates.find(([k]) => k === template)![1];

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!request.trim()) return;
    setBusy(true);
    setError(null);
    setText("");
    setStatus("Reading your saves");
    try {
      const res = await fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template, request, collectionId: collection || undefined }) });
      if (!res.ok || !res.body) {
        setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn't make the plan.");
        return;
      }
      let planId: string | null = null;
      await readNdjson(res, (ev) => {
        if (ev.type === "status") setStatus(String(ev.text));
        else if (ev.type === "text") {
          setStatus(null);
          setText((x) => x + String(ev.text));
        } else if (ev.type === "plan") planId = String(ev.id);
        else if (ev.type === "error") setError(String(ev.error));
      });
      if (planId) {
        router.push(`/app/planner/${planId}`);
        router.refresh();
      }
    } catch {
      setError("Connection lost. Try again.");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {templates.map(([k, info]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTemplate(k)}
            className={`rounded-2xl border p-4 text-left transition ${template === k ? "brand-ring border-violet-300 bg-white" : "border-line bg-white hover:border-violet-200"}`}
          >
            <span className="text-2xl">{info.emoji}</span>
            <p className="mt-2 text-sm font-semibold">{info.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{info.blurb}</p>
          </button>
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        <form onSubmit={generate} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">
              {t.emoji} What should the {t.title.toLowerCase()} be?
            </span>
            <textarea className={`${input} min-h-24 text-[15px]`} value={request} onChange={(e) => setRequest(e.target.value)} placeholder={t.placeholder} />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {t.examples.map((ex) => (
              <button key={ex} type="button" onClick={() => setRequest(ex)} className="rounded-full border border-line px-3 py-1 text-xs text-ink/75 hover:border-violet-300 hover:text-violet-700">
                {ex}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {collections.length > 0 && (
              <select value={collection} onChange={(e) => setCollection(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                <option value="">Use all my saves</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} From “{c.name}”
                  </option>
                ))}
              </select>
            )}
            <button disabled={busy || !request.trim() || !aiReady} className={`${btn.brand} ml-auto px-5 py-3`}>
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Make my plan
            </button>
          </div>
          {remaining !== null && <p className="text-right text-xs text-muted">{remaining} free plan{remaining === 1 ? "" : "s"} left this month</p>}
          {!aiReady && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">The planner needs AI. Add GEMINI_API_KEY or ANTHROPIC_API_KEY to .env.local.</p>}
        </form>
      </Card>

      {(busy || text || error) && (
        <Card className="p-6">
          {status && (
            <p className="mb-3 flex items-center gap-2 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" /> {status}…
            </p>
          )}
          {!text && busy && !status && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Sparkles className="h-4 w-4 text-violet-500" /> Writing your plan…
            </p>
          )}
          {text && <Answer text={text} catalog={catalog} />}
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </Card>
      )}
    </div>
  );
}
