import { after } from "next/server";
import { handleInbound } from "@/lib/ingest";
import { igConfig, parseWebhook, verifySignature, type WebhookBody } from "@/lib/instagram";

export const maxDuration = 300;

/** Meta's one-time subscription check. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const { verifyToken } = igConfig();
  if (p.get("hub.mode") === "subscribe" && verifyToken && p.get("hub.verify_token") === verifyToken) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** Incoming DMs. Answer 200 fast (Meta retries slow webhooks), then do the AI work after the response. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"), igConfig().appSecret)) {
    return new Response("Bad signature", { status: 401 });
  }
  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  const events = parseWebhook(body);
  if (events.length) after(() => handleInbound(events));
  return new Response("EVENT_RECEIVED", { status: 200 });
}
