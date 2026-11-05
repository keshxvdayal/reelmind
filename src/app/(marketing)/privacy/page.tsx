import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <article className="legal mx-auto max-w-3xl px-5 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="text-sm text-muted">Template. Have it reviewed by a lawyer before launch.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email and a hashed password.</li>
        <li>Content you send to the bot: the reels and posts you share, their captions, creator names, preview images and any note you add.</li>
        <li>Your Instagram-scoped user ID and username, so we can match DMs to your account. We never get your Instagram password.</li>
        <li>Questions you ask and the answers, so you can see your conversation history.</li>
        <li>Payment records from our payment provider (we never see your full card or UPI details).</li>
      </ul>
      <h2>How we use it</h2>
      <p>Only to run ReelMind for you: sorting and summarising your saves, answering your questions, sending the reminders you set, and billing. We do not sell your data and we do not show ads.</p>
      <h2>AI processing</h2>
      <p>To analyse saves and answer questions we send the relevant content to our AI provider. It is processed to produce your result and is not used to train models under our agreements with these providers.</p>
      <h2>Your choices</h2>
      <ul>
        <li>Export everything as CSV or JSON from Settings at any time.</li>
        <li>Delete individual saves, or your whole account, from Settings. Deletion is immediate and permanent.</li>
        <li>Disconnect Instagram from Settings. The bot stops accepting saves from your account.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions about privacy? Write to {process.env.SUPPORT_EMAIL ?? "hello@reelmind.app"}.</p>
    </article>
  );
}
