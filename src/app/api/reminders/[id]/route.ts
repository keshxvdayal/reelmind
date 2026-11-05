import { apiUser } from "@/lib/auth";
import { mutate } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

/** Mark done, or snooze to a new date. */
export async function PATCH(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { done?: boolean; dueAt?: string };
  const ok = await mutate((db) => {
    const r = db.reminders.find((x) => x.id === id && x.userId === user.id);
    if (!r) return false;
    if (typeof body.done === "boolean") r.doneAt = body.done ? new Date().toISOString() : null;
    if (body.dueAt && !Number.isNaN(new Date(body.dueAt).getTime())) {
      r.dueAt = new Date(body.dueAt).toISOString();
      r.sentAt = null;
      r.doneAt = null;
    }
    return true;
  });
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Not found." }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  await mutate((db) => void (db.reminders = db.reminders.filter((r) => !(r.id === id && r.userId === user.id))));
  return Response.json({ ok: true });
}
