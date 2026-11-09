import { expirePlans } from "@/lib/billing";
import { appUrl, reply } from "@/lib/ingest";
import { can, prefsOf } from "@/lib/plans";
import { mutate, readDb } from "@/lib/store";

/**
 * Send due reminders to Instagram DMs (Pro, linked, opted in) and expire
 * ended Pro periods. Runs every minute from instrumentation.ts.
 */
export async function sweep() {
  await expirePlans();
  const db = await readDb();
  const now = new Date().toISOString();
  const due = db.reminders.filter((r) => !r.doneAt && !r.sentAt && r.dueAt <= now);
  for (const r of due) {
    const user = db.users.find((u) => u.id === r.userId);
    const item = db.items.find((i) => i.id === r.itemId);
    const wantsDm = user && item && can(user, "reminderDms") && user.igUserId && prefsOf(user).reminderDms;
    if (wantsDm) {
      const title = item.analysis?.title ?? "your save";
      await reply(user.igUserId!, `⏰ Reminder: ${title}${r.note ? `\n${r.note}` : ""}\n${appUrl()}/app/saves/${item.id}`).catch((err) => console.error("[reminders]", err));
    }
    await mutate((d) => {
      const x = d.reminders.find((y) => y.id === r.id);
      if (x) x.sentAt = new Date().toISOString();
    });
  }
}

let started = false;
export function startReminderLoop() {
  if (started) return;
  started = true;
  const tick = () => sweep().catch((err) => console.error("[reminders] sweep failed", err));
  setTimeout(tick, 5_000);
  setInterval(tick, 60_000).unref?.();
}
