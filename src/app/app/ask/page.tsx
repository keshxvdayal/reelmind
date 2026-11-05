import { Chat } from "@/components/chat";
import { aiEnabled } from "@/lib/ai/client";
import { citedIds } from "@/lib/ai/ask";
import { requireUser } from "@/lib/auth";
import { buildCatalog } from "@/lib/catalog";
import { readDb } from "@/lib/store";

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string; chat?: string }> }) {
  const user = await requireUser();
  const { q, chat } = await searchParams;
  const db = await readDb();
  const chats = db.chats
    .filter((c) => c.userId === user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 30);
  const open = chat ? chats.find((c) => c.id === chat) : undefined;
  return (
    <Chat
      key={open?.id ?? q ?? "new"}
      catalog={buildCatalog(db, user.id)}
      chats={chats.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))}
      initialChat={open ? { id: open.id, messages: open.messages.map((m) => ({ role: m.role, text: m.text, itemIds: m.role === "assistant" ? citedIds(m.text) : undefined })) } : null}
      initialQuestion={open ? null : (q ?? null)}
      aiReady={aiEnabled()}
    />
  );
}
