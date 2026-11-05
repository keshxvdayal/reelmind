import { createHmac, timingSafeEqual } from "crypto";
import { price } from "@/lib/plans";
import { mutate, newId } from "@/lib/store";
import type { BillingInterval, Plan } from "@/lib/types";

/**
 * Pro is prepaid for a month or a year (no auto-renewal), paid through
 * Razorpay Checkout when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set.
 */
export const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

function periodEnd(from: Date, interval: BillingInterval): Date {
  const d = new Date(from);
  if (interval === "year") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/** Turn a plan on and record the payment. Paying again while Pro extends the current period. */
export async function activatePlan(userId: string, plan: Plan, interval: BillingInterval, payment: { provider: "razorpay" | "dev"; ref: string }) {
  await mutate((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return;
    const now = new Date();
    if (plan === "free") {
      u.plan = "free";
      u.planRenewsAt = null;
      return;
    }
    const base = u.plan === "pro" && u.planRenewsAt && new Date(u.planRenewsAt) > now ? new Date(u.planRenewsAt) : now;
    u.plan = "pro";
    u.billingInterval = interval;
    u.planRenewsAt = periodEnd(base, interval).toISOString();
    const existing = db.payments.find((p) => p.ref === payment.ref && p.provider === payment.provider && payment.provider === "razorpay");
    if (existing) existing.status = "paid";
    else
      db.payments.push({ id: newId(), userId, plan, interval, amount: price(plan, interval) * 100, currency: "INR", provider: payment.provider, ref: payment.ref, status: "paid", at: now.toISOString() });
  });
}

/** Pro periods that have ended fall back to Free. Mutates nothing if none expired. */
export async function expirePlans() {
  const now = new Date().toISOString();
  await mutate((db) => {
    for (const u of db.users) if (u.plan === "pro" && u.planRenewsAt && u.planRenewsAt < now) u.plan = "free";
  });
}

export async function createOrder(userId: string, interval: BillingInterval): Promise<{ orderId: string; amount: number; keyId: string }> {
  const amount = price("pro", interval) * 100;
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt: `rm_${userId}_${Date.now()}`.slice(0, 40), notes: { userId, plan: "pro", interval } }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
  const order = (await res.json()) as { id: string };
  await mutate((db) => {
    db.payments.push({ id: newId(), userId, plan: "pro", interval, amount, currency: "INR", provider: "razorpay", ref: order.id, status: "created", at: new Date().toISOString() });
  });
  return { orderId: order.id, amount, keyId: process.env.RAZORPAY_KEY_ID! };
}

/** Razorpay's checkout signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "").update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
