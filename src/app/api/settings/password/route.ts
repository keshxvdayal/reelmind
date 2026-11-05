import { apiUser, hashPassword, verifyPassword } from "@/lib/auth";
import { mutate } from "@/lib/store";

export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { current, next } = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  if (!current || !verifyPassword(current, user.passwordHash)) return Response.json({ error: "Your current password is wrong." }, { status: 400 });
  if (!next || next.length < 8) return Response.json({ error: "Use a new password of at least 8 characters." }, { status: 400 });
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id)!;
    u.passwordHash = hashPassword(next);
  });
  return Response.json({ ok: true });
}
