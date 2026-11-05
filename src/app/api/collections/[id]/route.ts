import { randomBytes } from "crypto";
import { apiUser } from "@/lib/auth";
import { mutate } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

/** Rename, add/remove saves, or toggle the public share link. */
export async function PATCH(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { name?: string; emoji?: string; description?: string; add?: string[]; remove?: string[]; share?: boolean };
  const out = await mutate((db) => {
    const c = db.collections.find((x) => x.id === id && x.userId === user.id);
    if (!c) return null;
    if (body.name?.trim()) c.name = body.name.trim().slice(0, 60);
    if (body.emoji?.trim()) c.emoji = [...body.emoji.trim()].slice(0, 2).join("");
    if (typeof body.description === "string") c.description = body.description.trim().slice(0, 200);
    if (body.add?.length) {
      const owned = new Set(db.items.filter((i) => i.userId === user.id).map((i) => i.id));
      c.itemIds = [...new Set([...body.add.filter((x) => owned.has(x)), ...c.itemIds])];
    }
    if (body.remove?.length) c.itemIds = c.itemIds.filter((x) => !body.remove!.includes(x));
    if (body.share === true && !c.shareToken) c.shareToken = randomBytes(12).toString("base64url");
    if (body.share === false) c.shareToken = null;
    c.updatedAt = new Date().toISOString();
    return { shareToken: c.shareToken, count: c.itemIds.length };
  });
  return out ? Response.json(out) : Response.json({ error: "Not found." }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const ok = await mutate((db) => {
    const before = db.collections.length;
    db.collections = db.collections.filter((c) => !(c.id === id && c.userId === user.id));
    return db.collections.length < before;
  });
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Not found." }, { status: 404 });
}
