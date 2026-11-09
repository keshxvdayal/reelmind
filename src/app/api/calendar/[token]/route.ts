import { appUrl } from "@/lib/ingest";
import { can } from "@/lib/plans";
import { readDb } from "@/lib/store";

type Ctx = { params: Promise<{ token: string }> };

/** RFC 5545 text escaping and 75-octet line folding. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let n = 75;
    while (Buffer.byteLength(rest.slice(0, n)) > 75) n--;
    out.push(rest.slice(0, n));
    rest = " " + rest.slice(n);
  }
  out.push(rest);
  return out.join("\r\n");
}

/**
 * Subscribable iCalendar feed of the user's open reminders (Premium).
 * The URL itself is the secret, so calendar apps can poll it without a login.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const db = await readDb();
  const user = token.length >= 20 ? db.users.find((u) => u.calendarToken === token) : undefined;
  if (!user || !can(user, "calendar")) return new Response("Not found", { status: 404 });

  const now = stamp(new Date().toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ReelMind//Reminders//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:ReelMind reminders", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  for (const r of db.reminders.filter((x) => x.userId === user.id && !x.doneAt)) {
    const item = db.items.find((i) => i.id === r.itemId);
    if (!item) continue;
    const title = item.analysis?.title ?? "Saved reel";
    const start = new Date(r.dueAt);
    const end = new Date(start.getTime() + 30 * 60_000);
    const url = `${appUrl()}/app/saves/${item.id}`;
    const desc = [r.note, item.analysis?.summary, ...(item.analysis?.actionItems ?? []).map((a) => `• ${a}`), url].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:reminder-${r.id}@reelmind`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(start.toISOString())}`,
      `DTEND:${stamp(end.toISOString())}`,
      `SUMMARY:${esc(`⏰ ${title}`)}`,
      `DESCRIPTION:${esc(desc)}`,
      `URL:${url}`,
      ...(item.analysis?.places[0] ? [`LOCATION:${esc(item.analysis.places[0])}`] : []),
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(title)}`,
      "TRIGGER:-PT0M",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=300", "Content-Disposition": 'inline; filename="reelmind.ics"' },
  });
}
