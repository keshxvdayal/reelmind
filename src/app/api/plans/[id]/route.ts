import { apiUser } from "@/lib/auth";
import { mutate } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const { title } = (await req.json().catch(() => ({}))) as { title?: string };
  const ok = await mutate((db) => {
    const p = db.plans.find((x) => x.id === id && x.userId === user.id);
    if (!p || !title?.trim()) return false;
    p.title = title.trim().slice(0, 90);
    return true;
  });
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Not found." }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  await mutate((db) => void (db.plans = db.plans.filter((p) => !(p.id === id && p.userId === user.id))));
  return Response.json({ ok: true });
}
