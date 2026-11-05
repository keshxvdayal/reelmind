import assert from "node:assert/strict";
import { test } from "node:test";
import { searchItems, slugify, tokens, upsertSection } from "@/lib/library";
import type { Analysis, Item } from "@/lib/types";

import { emptyDb as empty } from "@/lib/store";

function item(id: string, savedAt: string, a: Partial<Analysis>, sectionId: string | null = null): Item {
  return {
    id, userId: "u1", igSenderId: null, externalId: null, source: "manual", kind: "reel", url: null, hasMedia: false,
    caption: "", author: null, note: "", savedAt, status: "ready", error: null, sectionId, favorite: false, analyzedBy: "claude",
    analysis: { title: "", summary: "", sectionName: "", sectionEmoji: "", sectionDescription: "", subtopic: "", tags: [], intent: "learn", keyPoints: [], actionItems: [], places: [], people: [], products: [], mood: "", ...a },
  };
}

test("slugify", () => {
  assert.equal(slugify("Food & Recipes"), "food-and-recipes");
  assert.equal(slugify("  ✈️  "), "misc");
});

test("upsertSection reuses near-identical names", () => {
  const db = empty();
  const a = upsertSection(db, "u1", "Travel", "✈️", "trips");
  assert.equal(upsertSection(db, "u1", "travels", "🌍", "").id, a.id);
  assert.equal(upsertSection(db, "u1", " TRAVEL ", "🌍", "").id, a.id);
  assert.notEqual(upsertSection(db, "u2", "Travel", "✈️", "").id, a.id, "sections are per user");
  assert.equal(upsertSection(db, "u1", "Food & Recipes", "🍳", "").slug, "food-and-recipes");
});

test("tokens strips punctuation, hashtags and light plurals", () => {
  assert.deepEqual(tokens("Best #cafes in Goa!!"), ["best", "cafe", "goa"]);
});

test("search ranks by field weight and filters by date and section", () => {
  const db = empty();
  const travel = upsertSection(db, "u1", "Travel", "✈️", "");
  db.items.push(
    item("goa", "2026-07-01T10:00:00Z", { title: "Hidden cafés in North Goa", tags: ["goa", "cafes"], places: ["Goa"] }, travel.id),
    item("pasta", "2026-10-01T10:00:00Z", { title: "Lemon pasta", summary: "A quick dinner, nothing to do with goa trips" }),
    item("bali", "2026-03-01T10:00:00Z", { title: "Cheap Bali flights", tags: ["bali", "flights"] }, travel.id),
  );
  db.items.push({ ...item("other", "2026-07-01T10:00:00Z", { title: "Goa beaches" }), userId: "u2" });

  const hits = searchItems(db, "u1", { query: "goa" });
  assert.deepEqual(hits.map((h) => h.item.id), ["goa", "pasta"], "title/tag match ranks above summary match; other users excluded");

  assert.deepEqual(searchItems(db, "u1", { sectionSlug: "travel" }).map((h) => h.item.id), ["goa", "bali"]);
  assert.deepEqual(searchItems(db, "u1", { after: "2026-06-01", before: "2026-08-01" }).map((h) => h.item.id), ["goa"]);
  assert.deepEqual(searchItems(db, "u1", { before: "2026-03-01" }).map((h) => h.item.id), ["bali"], "date-only before is inclusive");
  assert.equal(searchItems(db, "u1", { query: "flight" })[0].item.id, "bali", "singular matches plural tag");
  assert.equal(searchItems(db, "u1", { query: "skydiving" }).length, 0);
});
