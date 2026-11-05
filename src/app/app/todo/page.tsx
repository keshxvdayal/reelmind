import type { Metadata } from "next";
import { TodoBoard } from "@/components/todo-board";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { suggestedTodos } from "@/lib/insights";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Try list" };

export default async function TodoPage() {
  const user = await requireUser();
  const db = await readDb();
  const mine = db.todos.filter((t) => t.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const todos = mine.map((t) => {
    const item = t.itemId ? db.items.find((i) => i.id === t.itemId) : undefined;
    const sec = item?.sectionId ? db.sections.find((s) => s.id === item.sectionId) : undefined;
    return { id: t.id, text: t.text, done: t.done, doneAt: t.doneAt, save: item ? { id: item.id, title: item.analysis?.title ?? "Save", emoji: sec?.emoji ?? "🗂️" } : null };
  });
  const doneCount = mine.filter((t) => t.done).length;
  return (
    <div className="rise">
      <PageHeader
        eyebrow="Library"
        title="Try list"
        subtitle={`Saving is step one. This is where saves turn into things you actually do.${mine.length ? ` ${doneCount} of ${mine.length} done.` : ""}`}
      />
      <TodoBoard todos={todos} suggestions={suggestedTodos(db, user.id, 8)} />
    </div>
  );
}
