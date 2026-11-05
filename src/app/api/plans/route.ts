import { aiEnabled } from "@/lib/ai/client";
import { askLibrary } from "@/lib/ai/ask";
import { apiUser } from "@/lib/auth";
import { TEMPLATES } from "@/lib/planner";
import { canCreatePlan, PLANS } from "@/lib/plans";
import { mutate, newId, readDb } from "@/lib/store";
import { PLAN_TEMPLATES, type PlanTemplate } from "@/lib/types";

export const maxDuration = 300;

/** Generate a plan from the user's saves. Streams NDJSON like /api/ask, then stores the plan. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { template?: string; request?: string; collectionId?: string };
  const template: PlanTemplate = PLAN_TEMPLATES.includes(body.template as PlanTemplate) ? (body.template as PlanTemplate) : "custom";
  const request = body.request?.trim().slice(0, 1000) ?? "";
  if (!request) return Response.json({ error: "Tell us what to plan." }, { status: 400 });
  if (!aiEnabled()) return Response.json({ error: "The planner needs AI. Add GEMINI_API_KEY or ANTHROPIC_API_KEY to .env.local and restart." }, { status: 503 });
  const db = await readDb();
  if (!canCreatePlan(db, user)) return Response.json({ error: `The Free plan includes ${PLANS.free.plansPerMonth} plans a month. Upgrade to Pro for unlimited.` }, { status: 402 });
  const collection = body.collectionId ? db.collections.find((c) => c.id === body.collectionId && c.userId === user.id) : undefined;

  const t = TEMPLATES[template];
  const question = `Make me a plan: ${request}${collection ? `\n\nUse the saves in my collection "${collection.name}" (id ${collection.id}) first.` : ""}`;
  const instructions = `${t.instructions}\n\nStart with a single line '# <short title for this plan>'. Search the saves thoroughly first (several searches). If the saves don't cover something, fill the gap and mark it "(my suggestion)".`;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: object) => controller.enqueue(encoder.encode(JSON.stringify(ev) + "\n"));
      for await (const ev of askLibrary({ userId: user.id, history: [], question, instructions, channel: "web" })) {
        if (ev.type === "done" && ev.text) {
          const title = ev.text.match(/^#\s+(.+)$/m)?.[1]?.trim().slice(0, 90) ?? `${t.title}: ${request.slice(0, 60)}`;
          const id = newId();
          await mutate((d) => {
            d.plans.push({ id, userId: user.id, template, title, request, text: ev.text.replace(/^#\s+.+\n+/, ""), itemIds: ev.itemIds, createdAt: new Date().toISOString() });
          });
          send({ type: "plan", id });
        }
        send(ev);
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
