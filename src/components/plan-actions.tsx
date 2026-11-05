"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Printer, Trash2 } from "lucide-react";
import { btn } from "@/components/ui";
import { call } from "@/lib/client-api";

export function PlanActions({ id, text }: { id: string; text: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(text.replace(/\s*\[\[save:[^\]]+\]\]/g, ""));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={btn.ghost}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
      </button>
      <button onClick={() => window.print()} className={btn.ghost}>
        <Printer className="h-4 w-4" /> Print / PDF
      </button>
      <button
        onClick={async () => {
          if (!confirm("Delete this plan?")) return;
          await call(`/api/plans/${id}`, "DELETE");
          router.push("/app/planner");
          router.refresh();
        }}
        className={btn.danger}
        aria-label="Delete plan"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
