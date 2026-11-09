"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { btn } from "@/components/ui";
import { call } from "@/lib/client-api";
import type { Currency, PaidPlan } from "@/lib/types";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, fn: () => void) => void };

function loadRazorpay(): Promise<RazorpayCtor | null> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(w.Razorpay ?? null);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}

/** Buy, renew or switch a paid plan. Uses Razorpay Checkout when configured; otherwise a development switch. */
export function CheckoutButton({ plan, interval, currency, label, autoStart, className, icon }: { plan: PaidPlan; interval: "month" | "year"; currency: Currency; label: string; autoStart?: boolean; className?: string; icon?: React.ReactNode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function buy() {
    setBusy(true);
    setError(null);
    const r = await call<{ dev?: boolean; orderId?: string; amount?: number; currency?: Currency; keyId?: string; name?: string; email?: string }>("/api/billing/checkout", "POST", { plan, interval, currency });
    if (!r.ok) {
      setBusy(false);
      return setError(r.error);
    }
    if (r.data.dev) {
      const d = await call("/api/account", "POST", { plan, interval });
      setBusy(false);
      if (!d.ok) return setError(d.error);
      router.replace("/app/billing?welcome=1");
      router.refresh();
      return;
    }
    const Razorpay = await loadRazorpay();
    if (!Razorpay) {
      setBusy(false);
      return setError("Couldn't load the payment window. Check your connection.");
    }
    const rzp = new Razorpay({
      key: r.data.keyId,
      amount: r.data.amount,
      currency: r.data.currency ?? currency,
      order_id: r.data.orderId,
      name: "ReelMind",
      description: `${plan === "premium" ? "Premium" : "Pro"} · ${interval === "year" ? "1 year" : "1 month"}`,
      prefill: { name: r.data.name, email: r.data.email },
      theme: { color: "#7c3aed" },
      handler: async (resp: RazorpayResponse) => {
        const v = await call("/api/billing/verify", "POST", resp);
        setBusy(false);
        if (!v.ok) return setError(v.error);
        router.replace("/app/billing?welcome=1");
        router.refresh();
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.open();
  }

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void buy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div className="space-y-2">
      <button onClick={buy} disabled={busy} className={className ?? `${btn.brand} w-full py-3`}>
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : (icon ?? <Sparkles className="h-4 w-4" />)} {label}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}

export function DowngradeButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!confirm("Switch to Free now? (Development only)")) return;
        setBusy(true);
        await call("/api/account", "POST", { plan: "free" });
        setBusy(false);
        router.refresh();
      }}
      className="text-xs text-muted underline-offset-2 hover:underline"
    >
      Switch back to Free (dev)
    </button>
  );
}
