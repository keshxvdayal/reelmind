"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Film, Image as ImageIcon, LoaderCircle, MessageCircle, RefreshCw, Send, Unlink } from "lucide-react";
import { btn, Card, input } from "@/components/ui";

export function LinkCode({ code, linked }: { code: string; linked: boolean }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function act(action: "new-code" | "unlink") {
    if (action === "unlink" && !confirm("Disconnect this Instagram account? Your saved items stay in your library.")) return;
    setBusy(true);
    await fetch("/api/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setBusy(false);
    router.refresh();
  }

  if (linked) {
    return (
      <button onClick={() => act("unlink")} disabled={busy} className={btn.ghost}>
        <Unlink className="h-4 w-4" /> Disconnect
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 px-4 py-2 font-mono text-xl font-semibold tracking-widest text-violet-700">{code}</code>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={btn.ghost}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
      </button>
      <button onClick={() => act("new-code")} disabled={busy} className={btn.subtle} title="Get a new code">
        <RefreshCw className="h-4 w-4" /> New code
      </button>
    </div>
  );
}

type SimLine = { at: string; dir: "in" | "out"; text: string };

const SAMPLES = [
  { kind: "reel" as const, caption: "3 days in Pondicherry under ₹8k 🌊 Day 1: French Quarter walk + Cafe des Arts. Day 2: Paradise Beach & Auroville. Day 3: Serenity beach sunrise. Save this for your next trip! #pondicherry #budgettravel" },
  { kind: "reel" as const, caption: "10 min no-equipment core burner 🔥 1. Dead bugs x 12 2. Hollow hold 30s 3. Bicycle crunch x 20 4. Plank shoulder taps x 16. Repeat 3 rounds #abs #homeworkout" },
  { kind: "post" as const, caption: "When your mind won't stop overthinking at night, try this: write the thought down, name the feeling, ask 'is this in my control today?' If not, let it wait till morning. 🤍 #mentalhealth #overthinking" },
  { kind: "reel" as const, caption: "Restaurant-style paneer butter masala at home 🧈 Ingredients: paneer 250g, tomatoes 4, cashews 10, butter 2 tbsp, kasuri methi, cream. Full recipe in comments! #paneer #recipe" },
];

export function DmSimulator({ log, linked, code }: { log: SimLine[]; linked: boolean; code: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<"reel" | "post" | "text">("reel");
  const [caption, setCaption] = useState(SAMPLES[0].caption);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(body: object) {
    setBusy(true);
    await fetch("/api/dev/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line bg-canvas px-5 py-3">
        <p className="text-sm font-semibold">DM simulator <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-800">dev only</span></p>
        <p className="text-xs text-muted">Sends the same webhook payload Instagram would, through the real pipeline. Use it to try everything before connecting Meta.</p>
      </div>
      {!linked && log.length > 0 && <p className="bg-violet-50 px-5 py-2 text-xs text-violet-700">Tip: send your code <b>{code}</b> as a text message to link this simulated account.</p>}
      <div className="max-h-80 space-y-2 overflow-y-auto px-5 py-4">
        {log.length === 0 && <p className="py-6 text-center text-sm text-muted">No simulated messages yet.</p>}
        {log.map((l, i) => (
          <div key={i} className={`flex ${l.dir === "in" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] ${l.dir === "in" ? "rounded-br-md bg-violet-600 text-white" : "rounded-bl-md bg-canvas text-ink"}`}>{l.text}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3 border-t border-line p-4">
        <div className="flex gap-1.5">
          {([
            ["reel", "Share a reel", Film],
            ["post", "Share a post", ImageIcon],
            ["text", "Send text", MessageCircle],
          ] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setKind(k)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${kind === k ? "bg-ink text-white" : "text-muted hover:bg-canvas"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        {kind === "text" ? (
          <div className="flex gap-2">
            <input className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder={linked ? "Ask something, e.g. what recipes did I save?" : `Send your code: ${code}`} />
            <button disabled={busy || !text.trim()} onClick={() => send({ kind: "text", text }).then(() => setText(""))} className={btn.brand}>
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {SAMPLES.map((s, i) => (
                <button key={i} onClick={() => { setCaption(s.caption); setKind(s.kind); }} className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-violet-300">
                  Sample {i + 1}
                </button>
              ))}
            </div>
            <textarea className={`${input} min-h-20`} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption of the reel or post" />
            <button disabled={busy} onClick={() => send({ kind, caption })} className={btn.brand}>
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send to bot
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
