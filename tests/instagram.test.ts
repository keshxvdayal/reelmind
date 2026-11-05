import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { LINK_CODE_RE, parseWebhook, splitForDm, verifySignature } from "@/lib/instagram";
import { newLinkCode } from "@/lib/store";

test("verifySignature accepts Meta's sha256 HMAC and rejects anything else", () => {
  const body = JSON.stringify({ object: "instagram" });
  const sig = "sha256=" + createHmac("sha256", "secret").update(body).digest("hex");
  assert.equal(verifySignature(body, sig, "secret"), true);
  assert.equal(verifySignature(body + " ", sig, "secret"), false);
  assert.equal(verifySignature(body, sig, "other"), false);
  assert.equal(verifySignature(body, null, "secret"), false);
  assert.equal(verifySignature(body, sig, ""), false, "no secret configured → reject");
});

const wrap = (message: object, sender = "111") => ({
  object: "instagram",
  entry: [{ id: "999", time: 1, messaging: [{ sender: { id: sender }, recipient: { id: "999" }, timestamp: 1767225600000, message }] }],
});

test("parses a shared reel with caption", () => {
  const [ev] = parseWebhook(wrap({ mid: "m1", attachments: [{ type: "ig_reel", payload: { url: "https://lookaside.fbsbx.com/x.mp4", title: "Goa cafés ☕", reel_video_id: "123" } }] }));
  assert.equal(ev.type, "share");
  if (ev.type !== "share") return;
  assert.equal(ev.kind, "reel");
  assert.equal(ev.caption, "Goa cafés ☕");
  assert.equal(ev.url, "https://www.instagram.com/reel/123/");
  assert.equal(ev.mediaUrl, "https://lookaside.fbsbx.com/x.mp4");
});

test("parses a pasted Instagram link and keeps the rest as a note", () => {
  const [ev] = parseWebhook(wrap({ mid: "m2", text: "for the trip https://www.instagram.com/reel/AbC_1/?igsh=xyz" }));
  assert.equal(ev.type, "share");
  if (ev.type === "share") {
    assert.equal(ev.url, "https://www.instagram.com/reel/AbC_1/?igsh=xyz");
    assert.equal(ev.text, "for the trip");
  }
});

test("ignores echoes, deletions and the bot's own messages; keeps plain text", () => {
  assert.equal(parseWebhook(wrap({ mid: "e", text: "hi", is_echo: true })).length, 0);
  assert.equal(parseWebhook(wrap({ mid: "d", is_deleted: true })).length, 0);
  assert.equal(parseWebhook(wrap({ mid: "b", text: "hi" }, "999")).length, 0);
  assert.equal(parseWebhook({ object: "page", entry: [] }).length, 0);
  assert.deepEqual(parseWebhook(wrap({ mid: "t", text: "what travel reels did I save?" }))[0].type, "text");
});

test("link codes are generated in the format the bot recognises", () => {
  for (let i = 0; i < 50; i++) assert.match(`my code is ${newLinkCode()}`, LINK_CODE_RE);
});

test("splitForDm keeps parts under Instagram's limit", () => {
  const text = Array.from({ length: 60 }, (_, i) => `Sentence number ${i} about a saved reel.`).join(" ");
  const parts = splitForDm(text);
  assert.ok(parts.length > 1);
  for (const p of parts) assert.ok(p.length <= 950);
});
