"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

export function AskBar({ placeholder = "Ask anything about what you saved…", section, collection }: { placeholder?: string; section?: string; collection?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!q.trim()) return;
        const question = collection ? `${q.trim()} (look in my "${collection}" collection first)` : section ? `${q.trim()} (look in my ${section} section first)` : q.trim();
        router.push(`/app/ask?q=${encodeURIComponent(question)}`);
      }}
      className="flex items-center gap-2 rounded-2xl border border-line bg-white p-2 pl-4 shadow-[0_10px_40px_-18px_rgba(76,29,149,0.35)] transition focus-within:border-violet-300"
    >
      <Search className="h-4 w-4 shrink-0 text-muted" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-muted/70" />
      <button type="submit" className="brand-gradient inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white">
        <Sparkles className="h-4 w-4" /> Ask
      </button>
    </form>
  );
}

export function PromptChips({ prompts }: { prompts: string[] }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((p) => (
        <button
          key={p}
          onClick={() => router.push(`/app/ask?q=${encodeURIComponent(p)}`)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] text-ink/80 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-500" /> {p}
        </button>
      ))}
    </div>
  );
}
