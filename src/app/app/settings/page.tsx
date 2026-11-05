import type { Metadata } from "next";
import Link from "next/link";
import { DangerZone, ExportButtons, PasswordForm, PrefsForm, ProfileForm } from "@/components/settings-forms";
import { Badge, btn, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { prefsOf } from "@/lib/plans";

export const metadata: Metadata = { title: "Settings" };

function Block({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <Card className="grid gap-5 p-6 md:grid-cols-[240px_1fr]">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>
      <div>{children}</div>
    </Card>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const pro = user.plan === "pro";
  return (
    <div className="rise space-y-5">
      <PageHeader eyebrow="Account" title="Settings" subtitle={`Member since ${fmtDate(user.createdAt)}`} />
      <Block title="Profile" hint="How ReelMind greets you, and where we send receipts.">
        <ProfileForm name={user.name} email={user.email} />
      </Block>
      <Block title="Password" hint="At least 8 characters.">
        <PasswordForm />
      </Block>
      <Block title="Instagram" hint="The account that sends saves to the bot.">
        <div className="flex flex-wrap items-center gap-3">
          {user.igUserId ? <Badge tone="green">Connected{user.igUsername ? ` · @${user.igUsername}` : ""}</Badge> : <Badge tone="amber">Not connected</Badge>}
          <Link href="/app/connect" className={btn.ghost}>
            Manage connection
          </Link>
        </div>
      </Block>
      <Block title="Notifications" hint="What the bot does in your Instagram DMs.">
        <PrefsForm prefs={prefsOf(user)} pro={pro} />
      </Block>
      <Block title="Export your data" hint="Every save with its summary, tags, places and notes.">
        <ExportButtons pro={pro} />
      </Block>
      <DangerZone />
    </div>
  );
}
