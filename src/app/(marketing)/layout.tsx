import { SiteFooter, SiteHeader } from "@/components/marketing";
import { currentUser } from "@/lib/auth";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader signedIn={Boolean(user)} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
