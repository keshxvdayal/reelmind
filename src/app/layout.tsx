import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "ReelMind: your second brain for Instagram saves", template: "%s · ReelMind" },
  description:
    "Send reels and posts to the ReelMind bot on Instagram. AI sorts them into sections, turns them into plans and checklists, and answers anything you ask about what you saved.",
  openGraph: {
    title: "ReelMind: never lose a saved reel again",
    description: "AI that remembers every reel and post you save, and turns them into trips, workouts, recipes and plans.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
