import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { currentUser } from "@/lib/auth";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/app");
  const demo = (await readDb()).users.some((u) => u.email === "demo@reelmind.app");
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your saved-reel memory.">
      <AuthForm mode="login" demoHint={demo} />
    </AuthShell>
  );
}
