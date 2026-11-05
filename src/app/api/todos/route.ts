import { apiUser } from "@/lib/auth";
import { mutate, newId } from "@/lib/store";

/** Add to the try list: free text, or action items taken from a save. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { text?: string; itemId?: string; texts?: string[] };
  const texts = (body.texts ?? [body.text ?? ""]).map((t) => t.trim().slice(0, 300)).filter(Boolean);
  if (!texts.length) return Response.json({ error: "Write something to try." }, { status: 400 });
  const added = await mutate((db) => {
    const itemId = body.itemId && db.items.some((i) => i.id === body.itemId && i.userId === user.id) ? body.itemId : null;
    const have = new Set(db.todos.filter((t) => t.userId === user.id && t.itemId === itemId).map((t) => t.text.toLowerCase()));
    const now = new Date().toISOString();
    const fresh = texts.filter((t) => !have.has(t.toLowerCase())).map((text) => ({ id: newId(), userId: user.id, itemId, text, done: false, doneAt: null, createdAt: now }));
    db.todos.push(...fresh);
    return fresh.length;
  });
  return Response.json({ added });
}
