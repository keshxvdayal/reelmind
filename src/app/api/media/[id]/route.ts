import { apiUser } from "@/lib/auth";
import { readDb, readMedia } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { id } = await params;
  const db = await readDb();
  if (!db.items.some((i) => i.id === id && i.userId === user.id)) return new Response("Not found", { status: 404 });
  const media = await readMedia(id);
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(media.data), {
    headers: { "Content-Type": media.contentType, "Cache-Control": "private, max-age=86400" },
  });
}
