import { apiUser } from "@/lib/auth";
import { mutate, newLinkCode } from "@/lib/store";

export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const { action } = (await req.json().catch(() => ({}))) as { action?: "new-code" | "unlink" };
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id)!;
    if (action === "new-code") u.linkCode = newLinkCode();
    if (action === "unlink") {
      u.igUserId = null;
      u.igUsername = null;
      u.linkedAt = null;
      u.linkCode = newLinkCode();
    }
  });
  return Response.json({ ok: true });
}
