import { createHmac, timingSafeEqual } from "crypto";
import { minorUnits, price, PRICES } from "@/lib/plans";
import { mutate, newId } from "@/lib/store";
import type { BillingInterval, Currency, PaidPlan, Plan } from "@/lib/types";

/**
 * Paid plans (Pro, Premium) are prepaid for a month or a year (no auto-renewal), paid through
 * Razorpay Checkout when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set.
 */
export const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

function periodEnd(from: Date, interval: BillingInterval): Date {
  const d = new Date(from);
  if (interval === "year") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Turn a plan on and record the payment. Paying again for the plan you have
 * extends the current period; switching plan starts a new period today.
 */
export async function activatePlan(userId: string, plan: Plan, interval: BillingInterval, payment: { provider: "razorpay" | "dev"; ref: string; currency?: Currency }) {
  await mutate((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return;
    const now = new Date();
    if (plan === "free") {
      u.plan = "free";
      u.planRenewsAt = null;
      return;
    }
    const left = u.planRenewsAt && u.plan !== "free" ? new Date(u.planRenewsAt).getTime() - now.getTime() : 0;
    // Same plan: extend. Different paid plan: unused time carries over, scaled by the price ratio.
    const credit = left <= 0 ? 0 : u.plan === plan ? left : left * (PRICES[u.plan as PaidPlan].USD.month / PRICES[plan].USD.month);
    const base = new Date(now.getTime() + credit);
    u.plan = plan;
    u.billingInterval = interval;
    u.planRenewsAt = periodEnd(base, interval).toISOString();
    const existing = db.payments.find((p) => p.ref === payment.ref && p.provider === payment.provider && payment.provider === "razorpay");
    if (existing) existing.status = "paid";
    else {
      const currency = payment.currency ?? "USD";
      const amount = payment.provider === "dev" ? 0 : minorUnits(price(plan, interval, currency));
      db.payments.push({ id: newId(), userId, plan, interval, amount, currency, provider: payment.provider, ref: payment.ref, status: "paid", at: now.toISOString() });
    }
  });
}

/** Paid periods that have ended fall back to Free. Mutates nothing if none expired. */
export async function expirePlans() {
  const now = new Date().toISOString();
  await mutate((db) => {
    for (const u of db.users) if (u.plan !== "free" && u.planRenewsAt && u.planRenewsAt < now) u.plan = "free";
  });
}

export async function createOrder(userId: string, plan: PaidPlan, interval: BillingInterval, currency: Currency): Promise<{ orderId: string; amount: number; currency: Currency; keyId: string }> {
  const amount = minorUnits(price(plan, interval, currency));
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency, receipt: `rm_${userId}_${Date.now()}`.slice(0, 40), notes: { userId, plan, interval } }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
  const order = (await res.json()) as { id: string };
  await mutate((db) => {
    db.payments.push({ id: newId(), userId, plan, interval, amount, currency, provider: "razorpay", ref: order.id, status: "created", at: new Date().toISOString() });
  });
  return { orderId: order.id, amount, currency, keyId: process.env.RAZORPAY_KEY_ID! };
}

/** Razorpay's checkout signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "").update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
