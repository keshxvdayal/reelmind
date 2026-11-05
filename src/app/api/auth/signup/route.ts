import { hashPassword, startSession } from "@/lib/auth";
import { mutate, newId, newLinkCode } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string };
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Enter your name and a valid email." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Use a password of at least 8 characters." }, { status: 400 });

  const userId = await mutate((db) => {
    if (db.users.some((u) => u.email === email)) return null;
    const id = newId();
    db.users.push({
      id,
      email,
      name: name.slice(0, 60),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      plan: "free",
      linkCode: newLinkCode(),
      igUserId: null,
      igUsername: null,
      linkedAt: null,
    });
    return id;
  });
  if (!userId) return Response.json({ error: "An account with this email already exists. Log in instead." }, { status: 409 });
  await startSession(userId);
  return Response.json({ ok: true });
}
