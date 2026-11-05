import { apiUser } from "@/lib/auth";
import { handleInbound, simulatorEnabled } from "@/lib/ingest";
import { parseWebhook, type WebhookBody } from "@/lib/instagram";
import { logWebhook, mutate, newId } from "@/lib/store";

export const maxDuration = 300;

/**
 * Development only: pretend the signed-in user's Instagram sent the bot a DM.
 * Builds the same webhook payload Meta sends and runs it through the real pipeline.
 */
export async function POST(req: Request) {
  if (!simulatorEnabled()) return new Response("Not found", { status: 404 });
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { kind?: "reel" | "post" | "text"; caption?: string; url?: string; text?: string };

  const senderId = user.igUserId ?? `sim-${user.id}`;
  const attachments =
    body.kind === "text"
      ? undefined
      : [{ type: body.kind === "post" ? "share" : "ig_reel", payload: { url: body.url || `https://www.instagram.com/reel/SIM${newId()}/`, title: body.caption ?? "" } }];
  const payload: WebhookBody = {
    object: "instagram",
    entry: [{ id: "bot", time: Date.now(), messaging: [{ sender: { id: senderId }, recipient: { id: "bot" }, timestamp: Date.now(), message: { mid: `sim-${newId()}`, text: body.text, attachments } }] }],
  };
  if (senderId.startsWith("sim-")) {
    const shown = body.kind === "text" ? body.text ?? "" : `[shared a ${body.kind ?? "reel"}] ${body.caption ?? ""}`;
    await mutate((db) => logWebhook(db, `in:${senderId}`, shown.slice(0, 2000)));
  }
  await handleInbound(parseWebhook(payload));
  return Response.json({ ok: true, senderId });
}
