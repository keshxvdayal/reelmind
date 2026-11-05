import { startSession, verifyPassword } from "@/lib/auth";
import { readDb } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const user = (await readDb()).users.find((u) => u.email === email);
  if (!user || !verifyPassword(body.password ?? "", user.passwordHash)) {
    return Response.json({ error: "Wrong email or password." }, { status: 401 });
  }
  await startSession(user.id);
  return Response.json({ ok: true });
}
