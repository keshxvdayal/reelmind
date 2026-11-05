import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { sectionSummaries } from "@/lib/library";
import { PLANS } from "@/lib/plans";
import { readDb } from "@/lib/store";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const db = await readDb();
  const mine = db.items.filter((i) => i.userId === user.id);
  const sections = sectionSummaries(db, user.id).map(({ slug, name, emoji, count }) => ({ slug, name, emoji, count }));
  const now = new Date().toISOString();
  return (
    <Shell
      user={{ name: user.name, email: user.email, plan: user.plan }}
      sections={sections}
      linked={Boolean(user.igUserId)}
      pending={mine.filter((i) => i.status === "pending").length}
      total={mine.length}
      saveLimit={PLANS[user.plan].saveLimit}
      badges={{
        todos: db.todos.filter((t) => t.userId === user.id && !t.done).length,
        reminders: db.reminders.filter((r) => r.userId === user.id && !r.doneAt && r.dueAt <= now).length,
      }}
    >
      {children}
    </Shell>
  );
}
