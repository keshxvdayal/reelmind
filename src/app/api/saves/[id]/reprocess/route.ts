import { apiUser } from "@/lib/auth";
import { processItem } from "@/lib/ingest";
import { mutate } from "@/lib/store";

export const maxDuration = 120;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const ok = await mutate((db) => {
    const item = db.items.find((i) => i.id === id && i.userId === user.id);
    if (item) item.status = "pending";
    return Boolean(item);
  });
  if (!ok) return Response.json({ error: "Not found." }, { status: 404 });
  await processItem(id);
  return Response.json({ ok: true });
}
