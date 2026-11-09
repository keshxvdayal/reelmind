"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import type { Currency } from "@/lib/types";

const OPTIONS: { code: Currency; label: string }[] = [
  { code: "USD", label: "🇺🇸 USD $" },
  { code: "EUR", label: "🇪🇺 EUR €" },
  { code: "GBP", label: "🇬🇧 GBP £" },
  { code: "INR", label: "🇮🇳 INR ₹" },
];

/** Lets visitors pick the currency prices are shown (and charged) in. Remembered for a year. */
export function CurrencySwitcher({ value, tone = "light", className = "" }: { value: Currency; tone?: "light" | "dark"; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className={`relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${tone === "dark" ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10" : "border-line bg-white text-ink/75 shadow-sm hover:border-violet-200"} ${pending ? "opacity-60" : ""} ${className}`}>
      <Globe className="h-3.5 w-3.5" />
      <span className="sr-only">Currency</span>
      <select
        value={value}
        onChange={(e) => {
          document.cookie = `rm_currency=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
          start(() => router.refresh());
        }}
        className="cursor-pointer appearance-none bg-transparent pr-1 outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.code} value={o.code} className="text-ink">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
