import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string; interval?: string }> }) {
  if (await currentUser()) redirect("/app");
  const { plan, interval } = await searchParams;
  const paid = plan === "pro" || plan === "premium" ? plan : null;
  const next = paid ? `/app/billing?upgrade=${paid}-${interval === "month" ? "month" : "year"}` : "/app/connect";
  return (
    <AuthShell
      title="Create your account"
      subtitle={paid ? `Create your account, then check out ${paid === "premium" ? "Premium" : "Pro"}.` : "Free for your first 50 saves. No card needed."}
    >
      <AuthForm mode="signup" next={next} />
    </AuthShell>
  );
}
