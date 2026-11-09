import { cookies } from "next/headers";
import { apiUser, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { activatePlan } from "@/lib/billing";
import { getCurrency } from "@/lib/locale";
import { deleteMedia, mutate } from "@/lib/store";

/**
 * Switch plan without payment. Development only: in production plans change
 * through /api/billing (Razorpay) unless REELMIND_ALLOW_PLAN_SWITCH=1.
 */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  if (process.env.NODE_ENV === "production" && process.env.REELMIND_ALLOW_PLAN_SWITCH !== "1") {
    return Response.json({ error: "Use checkout to change plans." }, { status: 403 });
  }
  const { plan, interval } = (await req.json().catch(() => ({}))) as { plan?: string; interval?: string };
  if (plan !== "free" && plan !== "pro" && plan !== "premium") return Response.json({ error: "Unknown plan." }, { status: 400 });
  await activatePlan(user.id, plan, interval === "month" ? "month" : "year", { provider: "dev", ref: "dev-switch", currency: await getCurrency() });
  return Response.json({ ok: true });
}

/** Delete the account and everything in it. */
export async function DELETE(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !verifyPassword(password, user.passwordHash)) return Response.json({ error: "Enter your password to confirm." }, { status: 400 });
  const mediaIds = await mutate((db) => {
    const ids = db.items.filter((i) => i.userId === user.id && i.hasMedia).map((i) => i.id);
    db.items = db.items.filter((i) => i.userId !== user.id);
    db.sections = db.sections.filter((s) => s.userId !== user.id);
    db.chats = db.chats.filter((c) => c.userId !== user.id);
    db.collections = db.collections.filter((c) => c.userId !== user.id);
    db.plans = db.plans.filter((p) => p.userId !== user.id);
    db.todos = db.todos.filter((t) => t.userId !== user.id);
    db.reminders = db.reminders.filter((r) => r.userId !== user.id);
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    db.users = db.users.filter((u) => u.id !== user.id);
    return ids;
  });
  await Promise.all(mediaIds.map(deleteMedia));
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
