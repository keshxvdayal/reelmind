import { apiUser } from "@/lib/auth";
import { mutate } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { done?: boolean; text?: string };
  const ok = await mutate((db) => {
    const t = db.todos.find((x) => x.id === id && x.userId === user.id);
    if (!t) return false;
    if (typeof body.done === "boolean") {
      t.done = body.done;
      t.doneAt = body.done ? new Date().toISOString() : null;
    }
    if (body.text?.trim()) t.text = body.text.trim().slice(0, 300);
    return true;
  });
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Not found." }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  await mutate((db) => void (db.todos = db.todos.filter((t) => !(t.id === id && t.userId === user.id))));
  return Response.json({ ok: true });
}
