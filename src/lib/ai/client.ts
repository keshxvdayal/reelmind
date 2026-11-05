import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.REELMIND_MODEL ?? "claude-opus-5-5";

let client: Anthropic | null = null;
export function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export type Provider = "claude" | "gemini";

/** Claude when an Anthropic credential is set, otherwise Gemini when a Gemini key is set. */
export function provider(): Provider | null {
  const forced = process.env.REELMIND_AI_PROVIDER;
  const claude = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE);
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  if (forced === "gemini" && gemini) return "gemini";
  if (forced === "claude" && claude) return "claude";
  return claude ? "claude" : gemini ? "gemini" : null;
}

/** AI mode is on when either provider is configured. */
export function aiEnabled(): boolean {
  return provider() !== null;
}

// Server-side fallback: if the model declines for policy reasons, the API
// re-runs the request on Anthropic's recommended substitute model.
export const FALLBACK: { betas: Anthropic.Beta.AnthropicBeta[]; fallbacks: "default" } = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};
