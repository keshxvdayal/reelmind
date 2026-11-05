import { DEFAULT_PREFS, type BillingInterval, type Db, type Plan, type User, type UserPrefs } from "@/lib/types";

export type PlanInfo = {
  name: string;
  tagline: string;
  /** Prices in rupees. */
  monthly: number;
  yearly: number;
  saveLimit: number | null;
  askPerDay: number | null;
  collectionLimit: number | null;
  plansPerMonth: number | null;
  perks: string[];
};

export const PLANS: Record<Plan, PlanInfo> = {
  free: {
    name: "Free",
    tagline: "For trying ReelMind out",
    monthly: 0,
    yearly: 0,
    saveLimit: 50,
    askPerDay: 10,
    collectionLimit: 3,
    plansPerMonth: 3,
    perks: ["50 saved reels & posts", "AI sections, summaries & tags", "10 questions a day", "3 collections", "3 AI plans a month", "In-app reminders"],
  },
  pro: {
    name: "Pro",
    tagline: "For people who save a lot",
    monthly: 299,
    yearly: 2499,
    saveLimit: null,
    askPerDay: null,
    collectionLimit: null,
    plansPerMonth: null,
    perks: [
      "Unlimited saves",
      "Unlimited questions",
      "Unlimited collections & AI plans",
      "Ask the bot right in Instagram DMs",
      "Reminders sent to your DMs",
      "Share collections with a link",
      "Export everything (CSV / JSON)",
      "Priority AI processing",
    ],
  },
};

export const price = (plan: Plan, interval: BillingInterval) => (interval === "year" ? PLANS[plan].yearly : PLANS[plan].monthly);
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
/** Percent saved by paying yearly. */
export const yearlySaving = () => Math.round((1 - PLANS.pro.yearly / (PLANS.pro.monthly * 12)) * 100);

export function prefsOf(user: User): UserPrefs {
  return { ...DEFAULT_PREFS, ...user.prefs };
}

export function saveCount(db: Db, userId: string) {
  return db.items.filter((i) => i.userId === userId).length;
}

export function canSave(db: Db, user: User): boolean {
  const limit = PLANS[user.plan].saveLimit;
  return limit === null || saveCount(db, user.id) < limit;
}

export function canCreateCollection(db: Db, user: User): boolean {
  const limit = PLANS[user.plan].collectionLimit;
  return limit === null || db.collections.filter((c) => c.userId === user.id).length < limit;
}

export function plansThisMonth(db: Db, userId: string) {
  const month = new Date().toISOString().slice(0, 7);
  return db.plans.filter((p) => p.userId === userId && p.createdAt.startsWith(month)).length;
}

export function canCreatePlan(db: Db, user: User): boolean {
  const limit = PLANS[user.plan].plansPerMonth;
  return limit === null || plansThisMonth(db, user.id) < limit;
}

/** In-memory daily question counter (resets on restart; fine for a single-server pilot). */
const asks = new Map<string, { day: string; n: number }>();

export function asksToday(user: User): number {
  const entry = asks.get(user.id);
  return entry?.day === new Date().toISOString().slice(0, 10) ? entry.n : 0;
}

export function takeAsk(user: User): boolean {
  const limit = PLANS[user.plan].askPerDay;
  const day = new Date().toISOString().slice(0, 10);
  const n = asksToday(user);
  if (limit !== null && n >= limit) return false;
  asks.set(user.id, { day, n: n + 1 });
  return true;
}
