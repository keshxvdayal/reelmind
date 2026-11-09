import { askToText, SAVE_MARKER } from "@/lib/ai/ask";
import { aiEnabled } from "@/lib/ai/client";
import { classify, classifyByKeywords, ClassifyError } from "@/lib/ai/classify";
import { downloadImage, fetchUsername, LINK_CODE_RE, sendDm, type Inbound } from "@/lib/instagram";
import { pruneEmptySections, upsertSection } from "@/lib/library";
import { can, canSave, PLANS, prefsOf, takeAsk } from "@/lib/plans";
import { logWebhook, mutate, newId, readDb, readMedia, saveMedia } from "@/lib/store";
import type { Item, ItemKind, ItemSource, User } from "@/lib/types";

export const simulatorEnabled = () => process.env.NODE_ENV !== "production" || process.env.REELMIND_ALLOW_SIMULATOR === "1";

/** Reply to a DM. Simulated senders (from the dashboard's DM simulator) get their reply logged instead of sent. */
export async function reply(senderId: string, text: string) {
  if (senderId.startsWith("sim-")) {
    await mutate((db) => logWebhook(db, `reply:${senderId}`, text.slice(0, 2000)));
    return;
  }
  await sendDm(senderId, text);
}

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

function newItem(fields: Partial<Item> & { kind: ItemKind; source: ItemSource }): Item {
  return {
    id: newId(),
    userId: null,
    igSenderId: null,
    externalId: null,
    url: null,
    hasMedia: false,
    caption: "",
    author: null,
    note: "",
    savedAt: new Date().toISOString(),
    status: "pending",
    error: null,
    sectionId: null,
    analysis: null,
    favorite: false,
    analyzedBy: null,
    ...fields,
  };
}

/** Classify one item with the AI and file it into a section. Safe to call again (re-analyse). */
export async function processItem(itemId: string): Promise<Item | null> {
  const db = await readDb();
  const item = db.items.find((i) => i.id === itemId);
  if (!item) return null;
  const existingSections = db.sections
    .filter((s) => s.userId === item.userId && db.items.some((i) => i.sectionId === s.id))
    .map((s) => ({ name: s.name, description: s.description }));
  const media = item.hasMedia ? await readMedia(item.id) : null;

  let result: Awaited<ReturnType<typeof classify>>;
  try {
    result = await classify({ item, image: media ? { data: media.data, mediaType: media.contentType } : null, existingSections });
  } catch (err) {
    console.error(`[ingest] classify ${itemId} failed:`, err);
    // Keep the save findable even when the AI call fails.
    result = { analysis: classifyByKeywords({ item }), by: "keywords" };
    if (err instanceof ClassifyError) result.analysis.summary = `${err.message} ${result.analysis.summary}`;
  }

  return mutate((db) => {
    const it = db.items.find((i) => i.id === itemId);
    if (!it) return null;
    const a = result.analysis;
    if (it.userId) {
      const section = upsertSection(db, it.userId, a.sectionName, a.sectionEmoji, a.sectionDescription);
      it.sectionId = section.id;
      pruneEmptySections(db, it.userId);
    }
    it.analysis = a;
    it.analyzedBy = result.by;
    it.status = "ready";
    it.error = null;
    return { ...it };
  });
}

/** Manual add from the dashboard (paste a link and/or caption). */
export async function addManualItem(user: User, input: { url: string | null; caption: string; note: string; author: string | null; image?: { data: Buffer; contentType: string } | null }) {
  const created = await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id)!;
    if (!canSave(db, u)) return null;
    const item = newItem({
      userId: user.id,
      source: "manual",
      kind: input.url ? (/\/p\//.test(input.url) ? "post" : /instagram\.com/.test(input.url) ? "reel" : "link") : "note",
      url: input.url,
      caption: input.caption,
      note: input.note,
      author: input.author,
    });
    db.items.push(item);
    return item;
  });
  if (!created) return null;
  if (input.image) {
    await saveMedia(created.id, input.image.data, input.image.contentType);
    await mutate((db) => void (db.items.find((i) => i.id === created.id)!.hasMedia = true));
  }
  return created;
}

/* ------------------------------------------------------------------ *
 * Instagram DM handling                                               *
 * ------------------------------------------------------------------ */
function dmLinks(text: string): string {
  return text.replace(SAVE_MARKER, (_, id) => ` (${appUrl()}/app/saves/${id})`).replace(/ +\(/g, " (");
}

async function handleShare(ev: Extract<Inbound, { type: "share" }>) {
  const result = await mutate((db) => {
    if (db.items.some((i) => i.externalId === ev.mid)) return { kind: "duplicate" as const };
    const user = db.users.find((u) => u.igUserId === ev.senderId) ?? null;
    if (user && !canSave(db, user)) return { kind: "limit" as const };
    const firstPending = !user && !db.items.some((i) => i.igSenderId === ev.senderId && !i.userId);
    const item = newItem({
      userId: user?.id ?? null,
      igSenderId: ev.senderId,
      externalId: ev.mid,
      source: "instagram",
      kind: ev.kind,
      url: ev.url,
      caption: ev.caption,
      note: ev.text,
      savedAt: ev.at,
    });
    db.items.push(item);
    logWebhook(db, "share", `${ev.kind} from ${ev.senderId}${user ? ` (user ${user.id})` : " (not linked)"}`);
    return { kind: "saved" as const, item, user, firstPending };
  });

  if (result.kind === "duplicate") return;
  if (result.kind === "limit") {
    await reply(ev.senderId, `Your free plan is full (${PLANS.free.saveLimit} saves). Upgrade to Pro to keep saving: ${appUrl()}/app/billing`);
    return;
  }

  const { item, user, firstPending } = result;
  if (ev.mediaUrl && ev.kind !== "reel") {
    const img = await downloadImage(ev.mediaUrl);
    if (img) {
      await saveMedia(item.id, img.data, img.contentType);
      await mutate((db) => void (db.items.find((i) => i.id === item.id)!.hasMedia = true));
    }
  }

  if (!user) {
    // Keep the save; it moves into their library once they link their account.
    await processItem(item.id);
    if (firstPending) {
      await reply(
        ev.senderId,
        `Got it, saved! 👋 I'm your memory for reels and posts. To see everything sorted in your dashboard, create an account at ${appUrl()}/signup and send me the code it shows you (looks like RM-XXXXXX).`,
      );
    }
    return;
  }

  const done = await processItem(item.id);
  if (!prefsOf(user).dmConfirmations) return;
  const db = await readDb();
  const section = db.sections.find((s) => s.id === done?.sectionId);
  await reply(
    ev.senderId,
    `Saved to ${section ? `${section.emoji} ${section.name}` : "your library"}: ${done?.analysis?.title ?? "your reel"} ✓`,
  );
}

async function handleText(ev: Extract<Inbound, { type: "text" }>) {
  const code = ev.text.match(LINK_CODE_RE)?.[0]?.toUpperCase();
  if (code) {
    const username = await fetchUsername(ev.senderId);
    const linked = await mutate((db) => {
      const user = db.users.find((u) => u.linkCode === code);
      if (!user) return null;
      // One Instagram account belongs to one user.
      for (const other of db.users) if (other.igUserId === ev.senderId && other.id !== user.id) other.igUserId = null;
      user.igUserId = ev.senderId;
      user.igUsername = username ?? user.igUsername;
      user.linkedAt = new Date().toISOString();
      const adopted = db.items.filter((i) => i.igSenderId === ev.senderId && !i.userId);
      for (const i of adopted) {
        i.userId = user.id;
        // Already analysed while unlinked: file it into this user's sections without another AI call.
        if (i.analysis) i.sectionId = upsertSection(db, user.id, i.analysis.sectionName, i.analysis.sectionEmoji, i.analysis.sectionDescription).id;
      }
      logWebhook(db, "link", `${ev.senderId} → user ${user.id}, adopted ${adopted.length}`);
      return { user, adopted: adopted.map((i) => i.id) };
    });
    if (!linked) {
      await reply(ev.senderId, `That code didn't match an account. Open ${appUrl()}/app/connect to see your current code.`);
      return;
    }
    await reply(
      ev.senderId,
      `You're connected, ${linked.user.name.split(" ")[0]}! 🎉${linked.adopted.length ? ` I moved your ${linked.adopted.length} earlier save${linked.adopted.length === 1 ? "" : "s"} into your library.` : ""} Share any reel or post with me and I'll sort it. You can also ask me things here, like "what travel reels did I save?"`,
    );
    return;
  }

  const db = await readDb();
  const user = db.users.find((u) => u.igUserId === ev.senderId);
  if (!user) {
    await reply(ev.senderId, `Hi! Share reels and posts with me and I'll remember them for you. Create your account at ${appUrl()}/signup, then send me your RM- code to connect.`);
    return;
  }
  if (/^\s*(help|menu|\?)\s*$/i.test(ev.text)) {
    await reply(
      ev.senderId,
      `Here's what I can do 👇\n• Share any reel or post with me to save it\n• Add a note in the same message to remember why\n• Ask me things like "what cafés did I save in Goa?"${can(user, "dmAnswers") ? "" : " (Pro)"}\nYour dashboard: ${appUrl()}/app`,
    );
    return;
  }
  if (!aiEnabled()) {
    await reply(ev.senderId, `I can't answer questions right now, but all your saves are on your dashboard: ${appUrl()}/app`);
    return;
  }
  if (!can(user, "dmAnswers")) {
    await reply(ev.senderId, `Asking me in DMs is part of ReelMind Pro. You can ask on your dashboard for free: ${appUrl()}/app/ask?q=${encodeURIComponent(ev.text.slice(0, 200))}`);
    return;
  }
  if (!prefsOf(user).dmAnswers) {
    await reply(ev.senderId, `DM answers are turned off in your settings. Ask on the dashboard: ${appUrl()}/app/ask`);
    return;
  }
  if (!takeAsk(user)) {
    await reply(ev.senderId, `You've used today's free questions. Upgrade to Pro for unlimited: ${appUrl()}/app/billing`);
    return;
  }
  const { text } = await askToText({ userId: user.id, history: [], question: ev.text, channel: "dm" });
  await reply(ev.senderId, dmLinks(text) || "I couldn't come up with an answer for that one. Try asking on the dashboard.");
}

export async function handleInbound(events: Inbound[]) {
  for (const ev of events) {
    try {
      if (ev.type === "share") await handleShare(ev);
      else await handleText(ev);
    } catch (err) {
      console.error("[ingest] event failed:", err);
      await mutate((db) => logWebhook(db, "error", String(err)));
    }
  }
}
