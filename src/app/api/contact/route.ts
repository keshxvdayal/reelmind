import { mutate, newId } from "@/lib/store";

const seen = new Map<string, number>();

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string; topic?: string; message?: string };
  const name = body.name?.trim().slice(0, 100) ?? "";
  const email = body.email?.trim().slice(0, 200) ?? "";
  const message = body.message?.trim().slice(0, 5000) ?? "";
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 5) return Response.json({ error: "Add your name, a valid email and a message." }, { status: 400 });
  // Light flood protection per address.
  const last = seen.get(email) ?? 0;
  if (Date.now() - last < 30_000) return Response.json({ error: "You just sent one. Give us a moment." }, { status: 429 });
  seen.set(email, Date.now());
  await mutate((db) => {
    db.contacts.push({ id: newId(), name, email, topic: body.topic?.slice(0, 30) ?? "support", message, at: new Date().toISOString() });
  });
  return Response.json({ ok: true });
}
