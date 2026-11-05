import { apiUser } from "@/lib/auth";
import { searchItems } from "@/lib/library";
import { readDb } from "@/lib/store";
import { toView } from "@/lib/view";

/** Fast keyword search for the ⌘K palette. */
export async function GET(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 200) ?? "";
  if (!q.trim()) return Response.json({ hits: [] });
  const db = await readDb();
  const hits = searchItems(db, user.id, { query: q, limit: 8 }).map(({ item }) => {
    const v = toView(db, item);
    return { id: v.id, title: v.title, emoji: v.section?.emoji ?? "🗂️", section: v.section?.name ?? "", subtitle: [v.section?.name, v.subtopic].filter(Boolean).join(" · ") };
  });
  return Response.json({ hits });
}
