import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ReminderList } from "@/components/reminder-list";
import { Badge, PageHeader, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { can, prefsOf } from "@/lib/plans";
import { readDb } from "@/lib/store";
import { reminderViews } from "@/lib/view";

export const metadata: Metadata = { title: "Reminders" };

export default async function RemindersPage() {
  const user = await requireUser();
  const db = await readDb();
  const now = new Date().toISOString();
  const mine = db.reminders.filter((r) => r.userId === user.id).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const due = mine.filter((r) => !r.doneAt && r.dueAt <= now);
  const upcoming = mine.filter((r) => !r.doneAt && r.dueAt > now);
  const done = mine.filter((r) => r.doneAt).reverse().slice(0, 20);
  const dm = can(user, "reminderDms") && user.igUserId && prefsOf(user).reminderDms;
  return (
    <div className="rise space-y-8">
      <PageHeader
        eyebrow="Library"
        title="Reminders"
        subtitle="Open any save and tap “Remind me” to bring it back at the right time."
        action={dm ? <Badge tone="green">Sent to your Instagram DMs</Badge> : <Badge tone="gray">In-app only{can(user, "reminderDms") ? "" : " · DMs on Pro"}</Badge>}
      />
      <section>
        <SectionTitle icon={<Bell className="h-4 w-4" />} title="Due now" />
        <ReminderList reminders={reminderViews(db, due)} empty="You're all caught up." />
      </section>
      <section>
        <SectionTitle title="Upcoming" />
        <ReminderList reminders={reminderViews(db, upcoming)} empty="No upcoming reminders. Open a save and choose “Remind me”." />
      </section>
      {done.length > 0 && (
        <section>
          <SectionTitle title="Done" />
          <ReminderList reminders={reminderViews(db, done)} empty="" />
        </section>
      )}
    </div>
  );
}
