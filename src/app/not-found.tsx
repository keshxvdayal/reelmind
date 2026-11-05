import Link from "next/link";
import { btn, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="hero-glow grid min-h-screen place-items-center px-5 text-center">
      <div>
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>
        <p className="font-display text-8xl italic brand-text">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">We couldn&apos;t find that page.</h1>
        <p className="mt-2 text-muted">Unlike your saves, this one really is lost.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={btn.ghost}>
            Home
          </Link>
          <Link href="/app" className={btn.brand}>
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
