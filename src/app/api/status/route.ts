import { apiUser } from "@/lib/auth";
import { readDb } from "@/lib/store";

/** Polled by the dashboard while saves are being analysed. */
export async function GET() {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const db = await readDb();
  const mine = db.items.filter((i) => i.userId === user.id);
  return Response.json({ total: mine.length, pending: mine.filter((i) => i.status === "pending").length, linked: Boolean(user.igUserId) });
}
