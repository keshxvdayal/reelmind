import { aiEnabled } from "@/lib/ai/client";
import { askLibrary, type AskEvent } from "@/lib/ai/ask";
import { apiUser } from "@/lib/auth";
import { PLANS, takeAsk } from "@/lib/plans";
import { mutate, newId, readDb } from "@/lib/store";

export const maxDuration = 300;

/** Streams newline-delimited JSON AskEvents, then saves the exchange to the chat. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (user instanceof Response) return user;
  const body = (await req.json().catch(() => ({}))) as { chatId?: string; question?: string };
  const question = body.question?.trim().slice(0, 2000) ?? "";
  if (!question) return Response.json({ error: "Ask something." }, { status: 400 });
  if (!aiEnabled()) {
    return Response.json({ error: "AI answers need an API key. Add GEMINI_API_KEY (or ANTHROPIC_API_KEY) to .env.local and restart." }, { status: 503 });
  }
  if (!takeAsk(user)) {
    return Response.json({ error: `Free plan includes ${PLANS.free.askPerDay} questions a day. Upgrade to Pro for unlimited.` }, { status: 402 });
  }

  const db = await readDb();
  const existing = body.chatId ? db.chats.find((c) => c.id === body.chatId && c.userId === user.id) : undefined;
  const chatId = existing?.id ?? newId();
  const history = existing?.messages ?? [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: AskEvent | { type: "chat"; chatId: string }) => controller.enqueue(encoder.encode(JSON.stringify(ev) + "\n"));
      send({ type: "chat", chatId });
      for await (const ev of askLibrary({ userId: user.id, history, question, channel: "web" })) {
        send(ev);
        if (ev.type === "done" && ev.text) {
          const now = new Date().toISOString();
          await mutate((db) => {
            let chat = db.chats.find((c) => c.id === chatId);
            if (!chat) {
              chat = { id: chatId, userId: user.id, title: question.slice(0, 70), createdAt: now, updatedAt: now, messages: [] };
              db.chats.push(chat);
            }
            chat.messages.push({ role: "user", text: question, at: now }, { role: "assistant", text: ev.text, at: now });
            chat.updatedAt = now;
          });
        }
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
