import { apiUser } from "@/lib/auth";
import { pruneEmptySections, upsertSection } from "@/lib/library";
import { deleteMedia, mutate } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { note?: string; favorite?: boolean; sectionId?: string; newSectionName?: string };
  const ok = await mutate((db) => {
    const item = db.items.find((i) => i.id === id && i.userId === user.id);
    if (!item) return false;
    if (typeof body.note === "string") item.note = body.note.slice(0, 1000);
    if (typeof body.favorite === "boolean") item.favorite = body.favorite;
    if (body.newSectionName?.trim()) {
      item.sectionId = upsertSection(db, user.id, body.newSectionName, "📁", "").id;
    } else if (body.sectionId && db.sections.some((s) => s.id === body.sectionId && s.userId === user.id)) {
      item.sectionId = body.sectionId;
    }
    pruneEmptySections(db, user.id);
    return true;
  });
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Not found." }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const ok = await mutate((db) => {
    const before = db.items.length;
    db.items = db.items.filter((i) => !(i.id === id && i.userId === user.id));
    for (const c of db.collections) if (c.userId === user.id) c.itemIds = c.itemIds.filter((x) => x !== id);
    db.todos = db.todos.filter((t) => !(t.userId === user.id && t.itemId === id));
    db.reminders = db.reminders.filter((r) => !(r.userId === user.id && r.itemId === id));
    pruneEmptySections(db, user.id);
    return db.items.length < before;
  });
  if (ok) await deleteMedia(id);
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Not found." }, { status: 404 });
}
