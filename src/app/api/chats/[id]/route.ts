import { apiUser } from "@/lib/auth";
import { mutate } from "@/lib/store";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  await mutate((db) => void (db.chats = db.chats.filter((c) => !(c.id === id && c.userId === user.id))));
  return Response.json({ ok: true });
}
