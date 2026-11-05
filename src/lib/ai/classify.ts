import type Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { FALLBACK, MODEL, getClient, provider } from "@/lib/ai/client";
import { geminiJson } from "@/lib/ai/gemini";
import { AnalysisSchema, type Analysis, type Item } from "@/lib/types";

const SYSTEM = `You organise a person's saved Instagram reels and posts into a personal library they can search months later. People save things and forget them; your job is to make each save findable and useful again.

For each save you get the caption, the link, the creator, any note the person added, and sometimes the image.

Sections:
- Sections are broad areas of life, e.g. "Travel", "Fitness", "Food & Recipes", "Mind & Emotions", "Money", "Career & Skills", "Learning", "Home & Style", "Relationships", "Tech & Tools", "Entertainment", "Motivation".
- You will see the person's existing sections. Reuse one (copy its name exactly) whenever the save reasonably fits. Create a new section only when nothing fits; keep new names broad so a section can hold dozens of saves.
- Put the narrower topic in subtopic (a destination, a muscle group, a dish, an emotion).

Content:
- Base everything on what the caption, note and image actually show. Do not invent places, steps or facts that are not there.
- Captions are often short, emoji-heavy, mixed Hindi/English (Hinglish) or another language. Write the title, summary and points in clear English, and keep original names.
- If the caption is empty or says almost nothing, use the link, creator and image; keep the summary honest about how little is known.
- Tags should include the words the person might type later to find this ("goa", "beach", "budget trip", "abs", "biryani", "overthinking").`;

export type ClassifyInput = {
  item: Pick<Item, "kind" | "url" | "caption" | "author" | "note">;
  image?: { data: Buffer; mediaType: string } | null;
  existingSections: { name: string; description: string }[];
};

export class ClassifyError extends Error {}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const cleanTags = (a: Analysis): Analysis => ({ ...a, tags: [...new Set(a.tags.map((t) => t.toLowerCase().trim()).filter(Boolean))] });

export async function classify(input: ClassifyInput): Promise<{ analysis: Analysis; by: "claude" | "gemini" | "keywords" }> {
  const p = provider();
  if (!p) return { analysis: classifyByKeywords(input), by: "keywords" };

  const { item } = input;
  const sections = input.existingSections.length
    ? input.existingSections.map((s) => `- ${s.name}: ${s.description}`).join("\n")
    : "(none yet: this is one of their first saves)";

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.image && (IMAGE_TYPES as readonly string[]).includes(input.image.mediaType)) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: input.image.mediaType as ImageType, data: input.image.data.toString("base64") },
    });
  }
  content.push({
    type: "text",
    text: `<existing_sections>\n${sections}\n</existing_sections>

<save>
type: ${item.kind}
link: ${item.url ?? "(none)"}
creator: ${item.author ?? "(unknown)"}
note from the person: ${item.note || "(none)"}
caption:
${item.caption || "(empty)"}
</save>

Analyse this save.`,
  });

  if (p === "gemini") {
    const parts = content.map((b) =>
      b.type === "image" && b.source.type === "base64" ? { inlineData: { mimeType: b.source.media_type, data: b.source.data } } : { text: b.type === "text" ? b.text : "" },
    );
    return { analysis: cleanTags(await geminiJson({ system: SYSTEM, parts, schema: AnalysisSchema })), by: "gemini" };
  }

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort: "low", format: betaZodOutputFormat(AnalysisSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new ClassifyError("The AI declined to analyse this save.");
  if (!response.parsed_output) throw new ClassifyError("The AI returned an unreadable analysis.");
  return { analysis: cleanTags(response.parsed_output), by: "claude" };
}

/* ------------------------------------------------------------------ *
 * Offline fallback (no API key): keyword rules. Rough, but keeps the  *
 * dashboard usable for demos and local development.                   *
 * ------------------------------------------------------------------ */
const RULES: { name: string; emoji: string; description: string; intent: Analysis["intent"]; words: string[] }[] = [
  { name: "Travel", emoji: "✈️", description: "Places to go, trips and travel tips", intent: "visit", words: ["travel", "trip", "beach", "mountain", "hotel", "flight", "visa", "itinerary", "goa", "bali", "manali", "ladakh", "kerala", "europe", "trek", "waterfall", "cafe in", "hidden gem", "places to visit", "road trip", "backpack"] },
  { name: "Fitness", emoji: "💪", description: "Workouts, exercises and staying active", intent: "do", words: ["workout", "gym", "exercise", "abs", "squat", "cardio", "yoga", "stretch", "muscle", "fat loss", "pushup", "push-up", "legs", "mobility", "run", "protein"] },
  { name: "Food & Recipes", emoji: "🍳", description: "Recipes, dishes and places to eat", intent: "cook", words: ["recipe", "cook", "biryani", "pasta", "paneer", "dessert", "cake", "breakfast", "dinner", "street food", "restaurant", "chai", "coffee", "ingredients", "bake", "snack"] },
  { name: "Mind & Emotions", emoji: "🧠", description: "Mental health, feelings and self-care", intent: "feel", words: ["anxiety", "overthinking", "healing", "therapy", "mental health", "self love", "self-love", "emotion", "stress", "breakup", "lonely", "peace", "calm", "journal", "meditation", "mindset"] },
  { name: "Money", emoji: "💰", description: "Personal finance, investing and saving", intent: "learn", words: ["money", "invest", "stock", "mutual fund", "sip", "budget", "tax", "salary", "finance", "saving", "crypto", "credit card", "loan"] },
  { name: "Career & Skills", emoji: "🚀", description: "Work, productivity and professional skills", intent: "learn", words: ["career", "interview", "resume", "linkedin", "job", "productivity", "excel", "startup", "business", "marketing", "freelance", "coding", "public speaking", "communication"] },
  { name: "Learning", emoji: "📚", description: "Knowledge, facts and things worth knowing", intent: "learn", words: ["learn", "fact", "history", "science", "book", "study", "language", "english", "explained", "how to", "tutorial", "lesson"] },
  { name: "Home & Style", emoji: "🏡", description: "Home decor, fashion and grooming", intent: "buy", words: ["decor", "room", "outfit", "fashion", "skincare", "hair", "makeup", "interior", "styling", "shoes", "haul"] },
  { name: "Relationships", emoji: "❤️", description: "Love, friendships and family", intent: "remember", words: ["relationship", "love", "partner", "boyfriend", "girlfriend", "friendship", "family", "marriage", "date idea", "gift"] },
  { name: "Motivation", emoji: "🔥", description: "Quotes and reminders that push you forward", intent: "feel", words: ["motivation", "discipline", "success", "quote", "hustle", "goals", "inspiration", "never give up", "consistency"] },
];

export function classifyByKeywords(input: Pick<ClassifyInput, "item">): Analysis {
  const { item } = input;
  const text = `${item.caption} ${item.note}`.toLowerCase();
  let best = { rule: null as (typeof RULES)[number] | null, hits: [] as string[] };
  for (const rule of RULES) {
    const hits = rule.words.filter((w) => text.includes(w));
    if (hits.length > best.hits.length) best = { rule, hits };
  }
  const hashtags = [...text.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]).slice(0, 6);
  const firstLine = item.caption.split("\n").find((l) => l.trim())?.replace(/#[\p{L}\p{N}_]+/gu, "").trim() ?? "";
  const title = (firstLine || item.note || `Saved ${item.kind}${item.author ? ` from @${item.author}` : ""}`).slice(0, 70);
  const rule = best.rule;
  return {
    title,
    summary: item.caption ? item.caption.slice(0, 220) : "No caption was shared with this save.",
    sectionName: rule?.name ?? "Everything else",
    sectionEmoji: rule?.emoji ?? "🗂️",
    sectionDescription: rule?.description ?? "Saves that don't fit another section yet",
    subtopic: best.hits[0] ?? "",
    tags: [...new Set([...best.hits, ...hashtags])].slice(0, 8),
    intent: rule?.intent ?? "remember",
    keyPoints: [],
    actionItems: [],
    places: [],
    people: [],
    products: [],
    mood: "",
  };
}
