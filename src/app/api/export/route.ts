import { apiUser } from "@/lib/auth";
import { userItems } from "@/lib/library";
import { PLANS } from "@/lib/plans";
import { readDb } from "@/lib/store";

const csvCell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/** Download the whole library. Pro feature. */
export async function GET(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  if (user.plan !== "pro") return Response.json({ error: `Export is part of ${PLANS.pro.name}.` }, { status: 402 });
  const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "json";
  const db = await readDb();
  const sections = new Map(db.sections.map((s) => [s.id, s.name]));
  const items = userItems(db, user.id);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const head = ["saved_at", "kind", "section", "title", "summary", "subtopic", "tags", "places", "key_points", "action_items", "creator", "note", "favorite", "url"];
    const rows = items.map((i) => {
      const a = i.analysis;
      return [i.savedAt, i.kind, i.sectionId ? sections.get(i.sectionId) : "", a?.title, a?.summary, a?.subtopic, a?.tags, a?.places, a?.keyPoints, a?.actionItems, i.author, i.note, i.favorite, i.url].map(csvCell).join(",");
    });
    return new Response([head.join(","), ...rows].join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="reelmind-${stamp}.csv"` },
    });
  }
  const data = {
    exportedAt: new Date().toISOString(),
    account: { name: user.name, email: user.email, plan: user.plan },
    saves: items.map((i) => ({ id: i.id, savedAt: i.savedAt, kind: i.kind, url: i.url, creator: i.author, caption: i.caption, note: i.note, favorite: i.favorite, section: i.sectionId ? sections.get(i.sectionId) : null, analysis: i.analysis })),
    collections: db.collections.filter((c) => c.userId === user.id).map(({ name, emoji, description, itemIds }) => ({ name, emoji, description, itemIds })),
    plans: db.plans.filter((p) => p.userId === user.id).map(({ title, template, request, text, createdAt }) => ({ title, template, request, text, createdAt })),
    tryList: db.todos.filter((t) => t.userId === user.id).map(({ text, done, itemId }) => ({ text, done, itemId })),
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="reelmind-${stamp}.json"` },
  });
}
