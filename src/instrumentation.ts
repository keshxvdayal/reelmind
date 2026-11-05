export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.REELMIND_DISABLE_WORKER !== "1") {
    const { startReminderLoop } = await import("@/lib/reminders");
    startReminderLoop();
  }
}
