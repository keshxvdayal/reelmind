import { createHmac, timingSafeEqual } from "crypto";
import type { ItemKind } from "@/lib/types";

/**
 * Instagram Messaging (Instagram API with Instagram Login).
 *
 * The platform owns one Instagram professional account: the "bot". Users DM
 * it reels and posts (share button → send to the bot). Meta calls our webhook
 * for every message; we reply through the Send API.
 */
const GRAPH = process.env.IG_GRAPH_URL ?? "https://graph.instagram.com";
const VERSION = process.env.IG_GRAPH_VERSION ?? "v23.0";

export const igConfig = () => ({
  appSecret: process.env.IG_APP_SECRET ?? "",
  verifyToken: process.env.IG_VERIFY_TOKEN ?? "",
  accessToken: process.env.IG_ACCESS_TOKEN ?? "",
  botUsername: process.env.NEXT_PUBLIC_IG_BOT_USERNAME ?? "reelmind.ai",
});

export function igConfigured() {
  const c = igConfig();
  return Boolean(c.appSecret && c.verifyToken && c.accessToken);
}

/** Meta signs the raw body with the app secret: X-Hub-Signature-256: sha256=<hex>. */
export function verifySignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=") || !appSecret) return false;
  const expected = Buffer.from(createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex"), "hex");
  const given = Buffer.from(header.slice(7), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/* ------------------------------------------------------------------ *
 * Webhook payload → what the user sent                                *
 * ------------------------------------------------------------------ */
type Attachment = { type?: string; payload?: { url?: string; title?: string; reel_video_id?: string } };
type MessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: { mid?: string; text?: string; is_echo?: boolean; is_deleted?: boolean; attachments?: Attachment[] };
};
export type WebhookBody = { object?: string; entry?: { id?: string; time?: number; messaging?: MessagingEvent[] }[] };

export type Inbound =
  | { type: "share"; senderId: string; mid: string; at: string; kind: ItemKind; url: string | null; mediaUrl: string | null; caption: string; text: string }
  | { type: "text"; senderId: string; mid: string; at: string; text: string };

const IG_LINK = /https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p|tv)\/[\w-]+\/?[^\s]*/i;

function kindFor(type: string): ItemKind | null {
  switch (type) {
    case "ig_reel":
    case "reel":
      return "reel";
    case "share":
    case "ig_post":
    case "image":
    case "video":
      return "post";
    case "story_mention":
      return "story";
    default:
      return null;
  }
}

export function parseWebhook(body: WebhookBody): Inbound[] {
  if (body.object !== "instagram") return [];
  const out: Inbound[] = [];
  for (const entry of body.entry ?? []) {
    for (const ev of entry.messaging ?? []) {
      const msg = ev.message;
      const senderId = ev.sender?.id;
      // Ignore our own outgoing messages (echoes), deletions and non-message events (reads, reactions).
      if (!msg || !senderId || msg.is_echo || msg.is_deleted || senderId === entry.id) continue;
      const at = new Date(ev.timestamp ?? Date.now()).toISOString();
      const mid = msg.mid ?? `${senderId}-${ev.timestamp}`;
      const text = (msg.text ?? "").trim();

      const shares = (msg.attachments ?? []).map((a, i) => ({ a, i, kind: kindFor(a.type ?? "") })).filter((x) => x.kind);
      for (const { a, i, kind } of shares) {
        const url = a.payload?.url ?? null;
        const isCdn = url ? !/instagram\.com\/(reel|reels|p|tv)\//.test(url) : false;
        out.push({
          type: "share",
          senderId,
          mid: shares.length > 1 ? `${mid}#${i}` : mid,
          at,
          kind: kind!,
          // A CDN url points at the media file; a permalink points at the post page.
          url: isCdn ? (a.payload?.reel_video_id ? `https://www.instagram.com/reel/${a.payload.reel_video_id}/` : null) : url,
          mediaUrl: isCdn ? url : null,
          caption: a.payload?.title ?? "",
          text,
        });
      }
      if (shares.length) continue;

      const link = text.match(IG_LINK)?.[0];
      if (link) {
        out.push({ type: "share", senderId, mid, at, kind: /\/p\//.test(link) ? "post" : "reel", url: link, mediaUrl: null, caption: "", text: text.replace(link, "").trim() });
      } else if (text) {
        out.push({ type: "text", senderId, mid, at, text });
      }
    }
  }
  return out;
}

export const LINK_CODE_RE = /\bRM-[23456789A-HJ-NP-Z]{6}\b/i;

/* ------------------------------------------------------------------ *
 * Send API                                                            *
 * ------------------------------------------------------------------ */
/** Instagram caps a text message at 1000 characters; split longer replies on paragraph/sentence breaks. */
export function splitForDm(text: string, max = 950): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    let cut = rest.lastIndexOf("\n", max);
    if (cut < max / 2) cut = rest.lastIndexOf(". ", max) + 1;
    if (cut < max / 2) cut = rest.lastIndexOf(" ", max);
    if (cut < max / 2) cut = max;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts.slice(0, 4);
}

export async function sendDm(recipientId: string, text: string): Promise<void> {
  const { accessToken } = igConfig();
  if (!accessToken) {
    console.info(`[instagram] (not configured) would DM ${recipientId}: ${text}`);
    return;
  }
  for (const part of splitForDm(text)) {
    const res = await fetch(`${GRAPH}/${VERSION}/me/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text: part } }),
    });
    if (!res.ok) console.error(`[instagram] send failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/** Instagram username for a sender id (needs the instagram_business_manage_messages permission). */
export async function fetchUsername(igsid: string): Promise<string | null> {
  const { accessToken } = igConfig();
  if (!accessToken) return null;
  try {
    const res = await fetch(`${GRAPH}/${VERSION}/${igsid}?fields=username`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    return ((await res.json()) as { username?: string }).username ?? null;
  } catch {
    return null;
  }
}

/** Download an image from Instagram's CDN (URLs expire, so we keep a copy). Skips video and large files. */
export async function downloadImage(url: string): Promise<{ data: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const contentType = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !contentType.startsWith("image/")) return null;
    const data = Buffer.from(await res.arrayBuffer());
    return data.length > 5_000_000 ? null : { data, contentType };
  } catch {
    return null;
  }
}

/** Best-effort public preview (og: tags) for a pasted Instagram link. Instagram often blocks this; that's fine. */
export async function fetchPreview(url: string): Promise<{ caption: string; author: string | null; image: string | null }> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "ReelMindPreview/1.0", "Accept-Language": "en" },
    });
    if (!res.ok) return { caption: "", author: null, image: null };
    const html = (await res.text()).slice(0, 400_000);
    const meta = (p: string) =>
      html.match(new RegExp(`<meta[^>]+property=["']og:${p}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ?? null;
    const decode = (s: string) =>
      s.replace(/&quot;/g, '"').replace(/&#039;|&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
    const desc = decode(meta("description") ?? "");
    const title = decode(meta("title") ?? "");
    // og:description looks like: `12K likes, 80 comments - creator on June 1, 2026: "caption..."`
    const captionMatch = desc.match(/:\s*"([\s\S]*)"\.?\s*$/);
    const author = desc.match(/-\s*([\w.]+)\s+on\s/)?.[1] ?? title.match(/@([\w.]+)/)?.[1] ?? null;
    return { caption: captionMatch?.[1] ?? (desc || title), author, image: meta("image") ? decode(meta("image")!) : null };
  } catch {
    return { caption: "", author: null, image: null };
  }
}
