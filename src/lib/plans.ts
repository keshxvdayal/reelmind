import { DEFAULT_PREFS, type BillingInterval, type Currency, type Db, type PaidPlan, type Plan, type User, type UserPrefs } from "@/lib/types";

export type PlanInfo = {
  id: Plan;
  name: string;
  tagline: string;
  saveLimit: number | null;
  askPerDay: number | null;
  collectionLimit: number | null;
  plansPerMonth: number | null;
  perks: string[];
  /** Shown on pricing cards, marked "Coming soon". */
  soon?: string[];
};

export const PLANS: Record<Plan, PlanInfo> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "For trying ReelMind out",
    saveLimit: 50,
    askPerDay: 10,
    collectionLimit: 3,
    plansPerMonth: 3,
    perks: ["50 saved reels & posts", "AI sections, summaries & tags", "10 questions a day", "3 collections", "3 AI plans a month", "In-app reminders"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For people who save a lot",
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
      "Export everything (CSV / JSON)",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    tagline: "Your second brain, fully switched on",
    saveLimit: null,
    askPerDay: null,
    collectionLimit: null,
    plansPerMonth: null,
    perks: [
      "Everything in Pro",
      "Weekly AI digest of your saves",
      "Advanced insights: habits heatmap & streaks",
      "Calendar sync for reminders (Google, Apple, Outlook)",
      "Markdown export for Notion & Obsidian",
      "Priority email support",
    ],
    soon: ["Reel audio transcription", "Shared team libraries"],
  },
};

/** Higher plans include everything below them. */
const RANK: Record<Plan, number> = { free: 0, pro: 1, premium: 2 };
export const atLeast = (plan: Plan, needed: Plan) => RANK[plan] >= RANK[needed];
export const isPaid = (plan: Plan): plan is PaidPlan => plan !== "free";

/** Which plan unlocks each gated feature. */
export const FEATURE_PLAN = {
  dmAnswers: "pro",
  reminderDms: "pro",
  export: "pro",
  digest: "premium",
  advancedInsights: "premium",
  calendar: "premium",
  markdownExport: "premium",
} as const satisfies Record<string, PaidPlan>;
export type Feature = keyof typeof FEATURE_PLAN;
export const can = (user: Pick<User, "plan">, feature: Feature) => atLeast(user.plan, FEATURE_PLAN[feature]);

/**
 * List prices per currency, set per market rather than FX-converted so they
 * read as round numbers. Amounts in major units; checkout converts to minor units.
 */
export const PRICES: Record<PaidPlan, Record<Currency, Record<BillingInterval, number>>> = {
  pro: {
    USD: { month: 4.99, year: 39 },
    EUR: { month: 4.99, year: 39 },
    GBP: { month: 3.99, year: 34 },
    INR: { month: 299, year: 2499 },
  },
  premium: {
    USD: { month: 9.99, year: 79 },
    EUR: { month: 9.99, year: 79 },
    GBP: { month: 8.99, year: 69 },
    INR: { month: 599, year: 4999 },
  },
};

export const CURRENCY_META: Record<Currency, { label: string; symbol: string; locale: string; flag: string }> = {
  USD: { label: "US Dollar", symbol: "$", locale: "en-US", flag: "🇺🇸" },
  EUR: { label: "Euro", symbol: "€", locale: "en-IE", flag: "🇪🇺" },
  GBP: { label: "British Pound", symbol: "£", locale: "en-GB", flag: "🇬🇧" },
  INR: { label: "Indian Rupee", symbol: "₹", locale: "en-IN", flag: "🇮🇳" },
};

export const price = (plan: PaidPlan, interval: BillingInterval, currency: Currency) => PRICES[plan][currency][interval];
/** Smallest currency unit, as payment providers expect. */
export const minorUnits = (major: number) => Math.round(major * 100);

/** "$4.99", "₹2,499", "€39". Whole amounts drop the decimals. */
export function money(amount: number, currency: Currency): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(CURRENCY_META[currency].locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

/** Effective monthly price when paying yearly, rounded down to a clean number. */
export const perMonthYearly = (plan: PaidPlan, currency: Currency) => {
  const m = PRICES[plan][currency].year / 12;
  return currency === "INR" ? Math.round(m) : Math.floor(m * 100) / 100;
};

/** Percent saved by paying yearly. */
export const yearlySaving = (plan: PaidPlan = "pro", currency: Currency = "USD") => {
  const p = PRICES[plan][currency];
  return Math.round((1 - p.year / (p.month * 12)) * 100);
};

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
