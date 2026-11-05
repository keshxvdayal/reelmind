import { CheckCircle2, MessageCircle, Send, Share2 } from "lucide-react";
import { DmSimulator, LinkCode } from "@/components/connect-panel";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { simulatorEnabled } from "@/lib/ingest";
import { igConfig, igConfigured } from "@/lib/instagram";
import { readDb } from "@/lib/store";

export default async function ConnectPage() {
  const user = await requireUser();
  const db = await readDb();
  const bot = igConfig().botUsername;
  const linked = Boolean(user.igUserId);
  const simSender = user.igUserId?.startsWith("sim-") ? user.igUserId : `sim-${user.id}`;
  const log = db.webhookLog
    .filter((l) => l.kind === `in:${simSender}` || l.kind === `reply:${simSender}`)
    .slice(-30)
    .map((l) => ({ at: l.at, dir: l.kind.startsWith("in:") ? ("in" as const) : ("out" as const), text: l.detail }));

  const steps = [
    { icon: Send, title: `Follow and message @${bot}`, body: "Open Instagram, find the ReelMind bot account and start a chat." },
    { icon: MessageCircle, title: "Send your link code", body: "Paste the code below as a message. The bot replies when you're connected." },
    { icon: Share2, title: "Share reels and posts to the bot", body: "On any reel or post tap Share (paper plane) → pick the bot. Add a note in the message if you like." },
  ];

  return (
    <div className="rise space-y-6">
      <PageHeader title="Connect Instagram" subtitle="Your Instagram talks to ReelMind through direct messages. No password needed." />

      <Card className="p-6 sm:p-8">
        {linked ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="font-semibold">Connected{user.igUsername ? ` as @${user.igUsername}` : ""}</p>
                <p className="text-sm text-muted">Since {user.linkedAt ? fmtDate(user.linkedAt) : "recently"}. Share any reel to @{bot} and it appears here.</p>
              </div>
            </div>
            <LinkCode code={user.linkCode} linked />
          </div>
        ) : (
          <div className="space-y-6">
            <ol className="grid gap-4 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={i} className="rounded-2xl bg-canvas p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="brand-gradient grid h-7 w-7 place-items-center rounded-lg text-xs font-bold text-white">{i + 1}</span>
                    <s.icon className="h-4 w-4 text-muted" />
                  </div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
            <div>
              <p className="mb-2 text-sm font-medium">Your link code</p>
              <LinkCode code={user.linkCode} linked={false} />
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 text-sm">
        <p className="font-medium">Ask from Instagram too</p>
        <p className="mt-1 text-muted">
          Once connected, text the bot a question like <i>&ldquo;what cafés did I save in Goa?&rdquo;</i> and it replies with links to your saves.
        </p>
      </Card>

      {!igConfigured() && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The Instagram bot isn&apos;t configured on this server yet (IG_APP_SECRET, IG_VERIFY_TOKEN, IG_ACCESS_TOKEN). See the README for the Meta setup. Until then, use the simulator below.
        </p>
      )}

      {simulatorEnabled() && <DmSimulator log={log} linked={linked} code={user.linkCode} />}
    </div>
  );
}
