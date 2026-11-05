import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Content } from "@google/genai";
import { z } from "zod";
import { FALLBACK, MODEL, getClient, provider } from "@/lib/ai/client";
import { describeGeminiError, geminiAgent, type AgentTool } from "@/lib/ai/gemini";
import { searchItems, sectionSummaries, userItems } from "@/lib/library";
import { readDb } from "@/lib/store";
import { INTENTS, type ChatMessage, type Db, type Item } from "@/lib/types";

const SYSTEM = `You are ReelMind: the person's memory for everything they saved from Instagram, reels and posts about travel, food, fitness, feelings, money, skills and more. They forward saves to you over months and forget most of them. Your job is to find what they saved and turn it into something useful: answers, plans, checklists, reminders.

How to work:
- Before answering anything about their saves, search. Try several wordings and synonyms ("goa", "beach", "travel"; "abs", "core", "workout"), and the section filter when a section clearly fits. If they name a collection, filter by it.
- Vague time references are approximate. "4 months ago" means search roughly 3 to 5 months before today with the after/before filters, then widen if nothing turns up. People misremember, so if the dated search is empty, search without dates and say when it was actually saved.
- Open the full details (get_saves) of the saves you plan to rely on, so plans use their actual tips, places and steps.
- Never invent a save. If nothing matches, say so plainly and suggest what they might search for instead.
- When you add ideas that are not from their saves, label them clearly as your own suggestions, separate from what they saved.

Citing saves: every time you mention a specific save, put its marker right after it, exactly like [[save:ID]] using the id from the tools. The app turns markers into clickable cards. Do not print raw ids or links otherwise.

Plans: when they want to plan something (a trip, a week of workouts, meals, a study routine), build it from their saves first: group by day or step, say which save each part comes from, then list gaps you filled yourself.

Style: warm, direct, concise. Lead with the answer. Use short markdown: a heading or two, bullets, bold for key names. No filler. Reply in the language they write in (Hinglish is fine).`;

const DM_STYLE = `This reply is going out as an Instagram direct message: plain text only, no markdown, no headings, no asterisks. Keep it under 900 characters. Still put [[save:ID]] markers after saves you mention; the app converts them into links.`;

function compact(item: Item, sectionName: string | undefined) {
  const a = item.analysis;
  return {
    id: item.id,
    saved: item.savedAt.slice(0, 10),
    kind: item.kind,
    section: sectionName ?? null,
    title: a?.title ?? (item.caption.slice(0, 60) || "(untitled)"),
    subtopic: a?.subtopic || undefined,
    summary: a?.summary,
    tags: a?.tags,
    places: a?.places?.length ? a.places : undefined,
    creator: item.author ?? undefined,
    note: item.note || undefined,
    favorite: item.favorite || undefined,
  };
}

function libraryOverview(db: Db, userId: string): string {
  const items = userItems(db, userId);
  const sections = sectionSummaries(db, userId);
  const collections = db.collections.filter((c) => c.userId === userId);
  const oldest = items.at(-1)?.savedAt.slice(0, 10);
  const lines = sections.map((s) => `- ${s.emoji} ${s.name} (slug: ${s.slug}): ${s.count} saves. ${s.description}`);
  return `<context>
Today: ${new Date().toISOString().slice(0, 10)}
Library: ${items.length} saves${oldest ? `, oldest from ${oldest}` : ""}.
Sections:
${lines.join("\n") || "(no sections yet)"}
Collections (made by the person):
${collections.map((c) => `- ${c.emoji} ${c.name} (id: ${c.id}): ${c.itemIds.length} saves`).join("\n") || "(none)"}
</context>`;
}

export type AskEvent =
  | { type: "status"; text: string }
  | { type: "text"; text: string }
  | { type: "done"; text: string; itemIds: string[] }
  | { type: "error"; error: string };

class TruncatedToolInput extends Error {}

export const SAVE_MARKER = /\[\[save:([a-zA-Z0-9_-]+)\]\]/g;

export function citedIds(text: string): string[] {
  return [...new Set([...text.matchAll(SAVE_MARKER)].map((m) => m[1]))];
}

const SearchInput = z.object({
  query: z.string().optional().describe("Keywords. Omit to list saves by the other filters only"),
  section: z.string().optional().describe("Section slug to restrict to"),
  collection: z.string().optional().describe("Collection id or name to restrict to"),
  intent: z.enum(INTENTS).optional().describe("Restrict to saves with this purpose"),
  after: z.string().optional().describe("Only saves on or after this date, YYYY-MM-DD"),
  before: z.string().optional().describe("Only saves on or before this date, YYYY-MM-DD"),
  favorites_only: z.boolean().optional(),
  limit: z.number().int().min(1).max(60).optional().describe("Default 20"),
});
const GetInput = z.object({ ids: z.array(z.string()).min(1).max(25) });

/** Provider-neutral tool definitions over this user's library. */
function libraryTools(userId: string, status: (s: string) => void) {
  const search = {
    name: "search_saves",
    description:
      "Search the person's saved reels and posts. Matches words against titles, sections, tags, places, summaries, notes and captions. Returns the best matches, newest first when there is no query. Call it several times with different wordings for better recall.",
    schema: SearchInput,
    run: async (input: z.infer<typeof SearchInput>) => {
      status(input.query ? `Searching your saves for “${input.query}”` : `Looking through ${input.collection ?? input.section ?? "your"} saves`);
      const db = await readDb();
      const names = new Map(db.sections.filter((s) => s.userId === userId).map((s) => [s.id, s.name]));
      const hits = searchItems(db, userId, {
        query: input.query,
        sectionSlug: input.section,
        collection: input.collection,
        intent: input.intent,
        after: input.after,
        before: input.before,
        favoritesOnly: input.favorites_only,
        limit: input.limit ?? 20,
      });
      if (!hits.length) return "No saves matched. Try other words, a wider date range, or no section filter.";
      return JSON.stringify(hits.map((h) => compact(h.item, h.item.sectionId ? names.get(h.item.sectionId) : undefined)));
    },
  };
  const get = {
    name: "get_saves",
    description: "Get the full details of specific saves: the caption, key points, action items, places, products and the person's note.",
    schema: GetInput,
    run: async ({ ids }: z.infer<typeof GetInput>) => {
      status(`Reading ${ids.length} save${ids.length === 1 ? "" : "s"}`);
      const db = await readDb();
      const names = new Map(db.sections.filter((s) => s.userId === userId).map((s) => [s.id, s.name]));
      const found = db.items.filter((i) => i.userId === userId && ids.includes(i.id));
      if (!found.length) return "None of those ids exist.";
      return JSON.stringify(
        found.map((i) => ({
          ...compact(i, i.sectionId ? names.get(i.sectionId) : undefined),
          caption: i.caption.slice(0, 2000),
          keyPoints: i.analysis?.keyPoints,
          actionItems: i.analysis?.actionItems,
          people: i.analysis?.people,
          products: i.analysis?.products,
          mood: i.analysis?.mood,
          intent: i.analysis?.intent,
        })),
      );
    },
  };
  return { search, get };
}

export type AskOptions = {
  userId: string;
  history: ChatMessage[];
  question: string;
  channel: "web" | "dm";
  /** Extra instructions appended to the question (used by the planner). */
  instructions?: string;
};

/**
 * Answer a question about the user's library. An agent loop where the model
 * searches the library with tools, then streams its answer.
 */
export async function* askLibrary(opts: AskOptions): AsyncGenerator<AskEvent> {
  const db = await readDb();
  const userText = `${libraryOverview(db, opts.userId)}\n\n${opts.question}${opts.instructions ? `\n\n${opts.instructions}` : ""}${opts.channel === "dm" ? `\n\n${DM_STYLE}` : ""}`;
  const run = provider() === "gemini" ? askGemini(opts, userText) : askClaude(opts, userText);
  let answer: string | null = null;
  for await (const ev of run) {
    if (ev.type === "done") answer = ev.text;
    else yield ev;
    if (ev.type === "error") return;
  }
  // Only keep markers for saves that really belong to this user.
  const owned = new Set((await readDb()).items.filter((i) => i.userId === opts.userId).map((i) => i.id));
  const text = answer ?? "";
  yield { type: "done", text, itemIds: citedIds(text).filter((id) => owned.has(id)) };
}

async function* askGemini(opts: AskOptions, userText: string): AsyncGenerator<AskEvent> {
  const statuses: string[] = [];
  const { search, get } = libraryTools(opts.userId, (s) => statuses.push(s));
  const history: Content[] = opts.history.slice(-12).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));
  try {
    for await (const ev of geminiAgent({ system: SYSTEM, history, user: userText, tools: [search, get] as AgentTool[] })) {
      while (statuses.length) yield { type: "status", text: statuses.shift()! };
      if (ev.type === "final") yield { type: "done", text: ev.text, itemIds: [] };
      else yield ev;
    }
  } catch (err) {
    console.error("[ask:gemini]", err);
    yield { type: "error", error: describeGeminiError(err) };
  }
}

async function* askClaude(opts: AskOptions, userText: string): AsyncGenerator<AskEvent> {
  const statuses: string[] = [];
  const { search, get } = libraryTools(opts.userId, (s) => statuses.push(s));
  const tools = [
    betaZodTool({ name: search.name, description: search.description, inputSchema: SearchInput, eager_input_streaming: true, run: search.run }),
    betaZodTool({ name: get.name, description: get.description, inputSchema: GetInput, eager_input_streaming: true, run: get.run }),
  ];
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...opts.history.slice(-12).map((m) => ({ role: m.role, content: m.text }) as Anthropic.Beta.BetaMessageParam),
    { role: "user", content: userText },
  ];

  let runner = getClient().beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 64000,
    ...FALLBACK,
    output_config: { effort: "medium" },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools,
    messages,
    max_iterations: 8,
    stream: true,
  });

  let answer = "";
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        for await (const messageStream of runner) {
          while (statuses.length) yield { type: "status", text: statuses.shift()! };
          let turnText = "";
          for await (const event of messageStream) {
            if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
              yield { type: "status", text: "Searching your saves" };
            } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              turnText += event.delta.text;
              yield { type: "text", text: event.delta.text };
            }
          }
          const message = await messageStream.finalMessage();
          attempt = 0;
          const hasToolUse = message.content.some((b) => b.type === "tool_use");
          if (message.stop_reason === "max_tokens" && hasToolUse) throw new TruncatedToolInput("tool input truncated");
          if (message.stop_reason === "refusal") {
            yield { type: "error", error: "The AI declined to answer that one. Try rephrasing." };
            return;
          }
          // Text written before a tool call is narration; keep only the final turn's text as the answer.
          if (hasToolUse) {
            if (turnText) yield { type: "text", text: "\n\n" };
          } else answer = turnText;
        }
        break;
      } catch (err) {
        if (err instanceof Anthropic.APIError || err instanceof TruncatedToolInput || attempt >= 2) throw err;
        runner = getClient().beta.messages.toolRunner({ ...runner.params });
      }
    }
  } catch (err) {
    yield { type: "error", error: describeError(err) };
    return;
  }
  yield { type: "done", text: answer, itemIds: [] };
}

export function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "The Anthropic API key is invalid. Check ANTHROPIC_API_KEY in .env.local.";
  if (err instanceof Anthropic.RateLimitError) return "The AI is busy right now. Try again in a minute.";
  if (err instanceof Anthropic.APIError) return `The AI service returned an error (${err.status ?? "network"}). Try again.`;
  return "Something went wrong while answering. Try again.";
}

/** Collect a full answer (for Instagram DM replies). */
export async function askToText(opts: AskOptions): Promise<{ text: string; itemIds: string[] }> {
  for await (const ev of askLibrary(opts)) {
    if (ev.type === "done") return { text: ev.text, itemIds: ev.itemIds };
    if (ev.type === "error") return { text: ev.error, itemIds: [] };
  }
  return { text: "", itemIds: [] };
}
