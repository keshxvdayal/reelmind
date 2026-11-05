import { apiUser } from "@/lib/auth";
import { prefsOf } from "@/lib/plans";
import { mutate } from "@/lib/store";
import type { UserPrefs } from "@/lib/types";

export async function PATCH(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string; prefs?: Partial<UserPrefs> };
  const email = body.email?.trim().toLowerCase();
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "That email doesn't look right." }, { status: 400 });
  const err = await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id)!;
    if (email && email !== u.email) {
      if (db.users.some((x) => x.email === email)) return "Another account uses that email.";
      u.email = email;
    }
    if (body.name?.trim()) u.name = body.name.trim().slice(0, 60);
    if (body.prefs) {
      const cur = prefsOf(u);
      for (const k of Object.keys(cur) as (keyof UserPrefs)[]) if (typeof body.prefs[k] === "boolean") cur[k] = body.prefs[k]!;
      u.prefs = cur;
    }
    return null;
  });
  return err ? Response.json({ error: err }, { status: 409 }) : Response.json({ ok: true });
}
