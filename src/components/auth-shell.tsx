import { Check } from "lucide-react";
import { Logo } from "@/components/ui";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
          <p className="mb-8 mt-1.5 text-muted">{subtitle}</p>
          {children}
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} ReelMind</p>
      </div>
      <div className="night relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="brand-gradient absolute -right-24 top-10 h-80 w-80 rounded-full opacity-30 blur-3xl" />
        <div className="brand-gradient absolute -bottom-24 left-10 h-72 w-72 rounded-full opacity-20 blur-3xl" />
        <div className="relative mx-auto max-w-md">
          <p className="font-display text-5xl italic leading-tight">&ldquo;Wait, I saved that?&rdquo;</p>
          <p className="mt-4 text-white/70">What our users say most often when they ask ReelMind about their saves for the first time.</p>
          <ul className="mt-10 space-y-4">
            {["AI sorts every reel into sections of your life", "Ask anything, months later, even vaguely", "Turn saves into trips, workouts and meal plans", "Reminders right in your Instagram DMs"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10">
                  <Check className="h-3.5 w-3.5 text-fuchsia-300" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
