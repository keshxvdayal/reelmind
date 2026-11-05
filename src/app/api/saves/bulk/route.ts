import { apiUser } from "@/lib/auth";
import { pruneEmptySections } from "@/lib/library";
import { deleteMedia, mutate } from "@/lib/store";

/** Apply one action to many saves at once (from the library's select mode). */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { ids?: string[]; action?: "delete" | "favorite" | "unfavorite" | "move" | "collect"; sectionId?: string; collectionId?: string };
  const ids = new Set((body.ids ?? []).slice(0, 500));
  if (!ids.size) return Response.json({ error: "Select some saves first." }, { status: 400 });
  const result = await mutate((db) => {
    const mine = db.items.filter((i) => i.userId === user.id && ids.has(i.id));
    switch (body.action) {
      case "delete":
        db.items = db.items.filter((i) => !(i.userId === user.id && ids.has(i.id)));
        for (const c of db.collections) if (c.userId === user.id) c.itemIds = c.itemIds.filter((x) => !ids.has(x));
        db.todos = db.todos.filter((t) => !(t.userId === user.id && t.itemId && ids.has(t.itemId)));
        db.reminders = db.reminders.filter((r) => !(r.userId === user.id && ids.has(r.itemId)));
        break;
      case "favorite":
      case "unfavorite":
        for (const i of mine) i.favorite = body.action === "favorite";
        break;
      case "move":
        if (!db.sections.some((s) => s.id === body.sectionId && s.userId === user.id)) return null;
        for (const i of mine) i.sectionId = body.sectionId!;
        break;
      case "collect": {
        const c = db.collections.find((x) => x.id === body.collectionId && x.userId === user.id);
        if (!c) return null;
        c.itemIds = [...new Set([...mine.map((i) => i.id), ...c.itemIds])];
        c.updatedAt = new Date().toISOString();
        break;
      }
      default:
        return null;
    }
    pruneEmptySections(db, user.id);
    return mine.map((i) => i.id);
  });
  if (!result) return Response.json({ error: "That didn't work." }, { status: 400 });
  if (body.action === "delete") await Promise.all(result.map(deleteMedia));
  return Response.json({ ok: true, count: result.length });
}
