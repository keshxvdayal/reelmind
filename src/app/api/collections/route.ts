import { apiUser } from "@/lib/auth";
import { canCreateCollection, PLANS } from "@/lib/plans";
import { mutate, newId } from "@/lib/store";

export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { name?: string; emoji?: string; description?: string; itemIds?: string[] };
  const name = body.name?.trim().slice(0, 60);
  if (!name) return Response.json({ error: "Give the collection a name." }, { status: 400 });
  const result = await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id)!;
    if (!canCreateCollection(db, u)) return null;
    const owned = new Set(db.items.filter((i) => i.userId === user.id).map((i) => i.id));
    const now = new Date().toISOString();
    const c = {
      id: newId(),
      userId: user.id,
      name,
      emoji: [...(body.emoji?.trim() || "💜")].slice(0, 2).join(""),
      description: body.description?.trim().slice(0, 200) ?? "",
      itemIds: [...new Set(body.itemIds ?? [])].filter((id) => owned.has(id)),
      shareToken: null,
      createdAt: now,
      updatedAt: now,
    };
    db.collections.push(c);
    return c;
  });
  if (!result) return Response.json({ error: `The Free plan includes ${PLANS.free.collectionLimit} collections. Upgrade to Pro for unlimited.` }, { status: 402 });
  return Response.json({ id: result.id });
}
