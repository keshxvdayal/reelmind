import { apiUser } from "@/lib/auth";
import { userItems } from "@/lib/library";
import { can, PLANS } from "@/lib/plans";
import { readDb } from "@/lib/store";

const csvCell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/** Download the whole library. CSV/JSON on Pro; Markdown (Notion, Obsidian) on Premium. */
export async function GET(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  if (!can(user, "export")) return Response.json({ error: `Export is part of ${PLANS.pro.name}.` }, { status: 402 });
  const asked = new URL(req.url).searchParams.get("format");
  const format = asked === "csv" || asked === "md" ? asked : "json";
  if (format === "md" && !can(user, "markdownExport")) return Response.json({ error: `Markdown export is part of ${PLANS.premium.name}.` }, { status: 402 });
  const db = await readDb();
  const sections = new Map(db.sections.map((s) => [s.id, s.name]));
  const items = userItems(db, user.id);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "md") {
    const bySection = new Map<string, typeof items>();
    for (const i of items) {
      const key = (i.sectionId && sections.get(i.sectionId)) || "Unsorted";
      bySection.set(key, [...(bySection.get(key) ?? []), i]);
    }
    const out = [`# ReelMind library`, ``, `Exported ${stamp} · ${items.length} saves`, ``];
    for (const [name, list] of [...bySection].sort((a, b) => b[1].length - a[1].length)) {
      out.push(`## ${name}`, ``);
      for (const i of list) {
        const a = i.analysis;
        out.push(`### ${a?.title ?? (i.caption.slice(0, 60) || "Untitled save")}`, ``);
        const meta = [i.savedAt.slice(0, 10), i.author ? `@${i.author.replace(/^@/, "")}` : null, i.url ? `[Open on Instagram](${i.url})` : null].filter(Boolean);
        out.push(`*${meta.join(" · ")}*`, ``);
        if (a?.summary) out.push(a.summary, ``);
        if (a?.keyPoints.length) out.push(...a.keyPoints.map((k) => `- ${k}`), ``);
        if (a?.actionItems.length) out.push(`**To do**`, ...a.actionItems.map((k) => `- [ ] ${k}`), ``);
        if (a?.places.length) out.push(`**Places:** ${a.places.join(", ")}`, ``);
        if (i.note) out.push(`> ${i.note}`, ``);
        if (a?.tags.length) out.push(a.tags.map((t) => `#${t.replace(/\s+/g, "-")}`).join(" "), ``);
      }
    }
    return new Response(out.join("\n"), {
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="reelmind-${stamp}.md"` },
    });
  }

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
