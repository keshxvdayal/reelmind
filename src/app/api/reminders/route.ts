import { apiUser } from "@/lib/auth";
import { mutate, newId } from "@/lib/store";

export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { itemId?: string; dueAt?: string; note?: string };
  const due = body.dueAt ? new Date(body.dueAt) : null;
  if (!body.itemId || !due || Number.isNaN(due.getTime())) return Response.json({ error: "Pick a save and a date." }, { status: 400 });
  const id = await mutate((db) => {
    if (!db.items.some((i) => i.id === body.itemId && i.userId === user.id)) return null;
    const r = { id: newId(), userId: user.id, itemId: body.itemId!, dueAt: due.toISOString(), note: body.note?.trim().slice(0, 300) ?? "", sentAt: null, doneAt: null, createdAt: new Date().toISOString() };
    db.reminders.push(r);
    return r.id;
  });
  return id ? Response.json({ id }) : Response.json({ error: "Save not found." }, { status: 404 });
}
