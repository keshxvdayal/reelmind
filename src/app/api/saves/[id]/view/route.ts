import { apiUser } from "@/lib/auth";
import { mutate } from "@/lib/store";

/** Record that a save was opened (powers "forgotten saves" in Insights). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  await mutate((db) => {
    const item = db.items.find((i) => i.id === id && i.userId === user.id);
    if (!item) return;
    item.lastViewedAt = new Date().toISOString();
    item.viewCount = (item.viewCount ?? 0) + 1;
  });
  return Response.json({ ok: true });
}
