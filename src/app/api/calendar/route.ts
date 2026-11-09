import { apiUser } from "@/lib/auth";
import { can, PLANS } from "@/lib/plans";
import { mutate, newToken } from "@/lib/store";

/** Create (or rotate) the secret calendar feed URL. Premium. */
export async function POST() {
  const user = await apiUser();
  if (user instanceof Response) return user;
  if (!can(user, "calendar")) return Response.json({ error: `Calendar sync is part of ${PLANS.premium.name}.` }, { status: 402 });
  const token = newToken();
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.calendarToken = token;
  });
  return Response.json({ token });
}

/** Turn the feed off; any calendar subscribed to the old URL stops updating. */
export async function DELETE() {
  const user = await apiUser();
  if (user instanceof Response) return user;
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.calendarToken = null;
  });
  return Response.json({ ok: true });
}
