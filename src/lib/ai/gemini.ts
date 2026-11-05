import { ApiError, GoogleGenAI, ThinkingLevel, type Content, type FunctionCall, type Part } from "@google/genai";
import { z } from "zod";

/** Newest first; when a model is overloaded or out of quota we fall through to the next. */
export const GEMINI_MODELS = (process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []).concat([
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
]);

/** Not every model accepts every thinking level, so each gets one it supports. */
function thinkingFor(model: string, depth: "fast" | "deep") {
  if (/gemini-2\.5/.test(model)) return { thinkingBudget: depth === "fast" ? 0 : 2048 };
  if (/gemini-3\.(5|1)/.test(model)) return { thinkingLevel: depth === "fast" ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW };
  return { thinkingLevel: ThinkingLevel.LOW };
}

let client: GoogleGenAI | null = null;
// No SDK-level retries (they back off for up to a minute): we switch models instead.
const gemini = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { retryOptions: { attempts: 1 }, timeout: 120_000 } }));

const cooldown = new Map<string, number>();
function availableModels(): string[] {
  const ok = GEMINI_MODELS.filter((m) => (cooldown.get(m) ?? 0) < Date.now());
  return ok.length ? ok : GEMINI_MODELS;
}
function coolDown(model: string, status: number | undefined) {
  cooldown.set(model, Date.now() + (status === 429 ? 10 * 60_000 : 120_000));
}
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const FIRST_BYTE_MS = 10_000;

export function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  void _ignored;
  return rest;
}

/** One structured-output call, trying models in order. */
export async function geminiJson<T>(opts: { system: string; parts: Part[]; schema: z.ZodType<T> }): Promise<T> {
  let lastErr: unknown;
  const models = availableModels();
  for (const [i, model] of models.entries()) {
    // While a fallback is left, don't wait long on a slow model.
    const abort = new AbortController();
    const timer = i < models.length - 1 ? setTimeout(() => abort.abort(), 25_000) : undefined;
    try {
      const res = await gemini().models.generateContent({
        model,
        contents: [{ role: "user", parts: opts.parts }],
        config: {
          systemInstruction: opts.system,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema(opts.schema),
          thinkingConfig: thinkingFor(model, "fast"),
          maxOutputTokens: 8192,
          abortSignal: abort.signal,
        },
      });
      clearTimeout(timer);
      const parsed = opts.schema.safeParse(JSON.parse(res.text ?? ""));
      if (parsed.success) return parsed.data;
      lastErr = new Error(`Gemini returned an invalid analysis: ${parsed.error.issues[0]?.message}`);
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (abort.signal.aborted) {
        coolDown(model, undefined);
        continue;
      }
      if (err instanceof ApiError && RETRYABLE.has(err.status)) {
        coolDown(model, err.status);
        continue;
      }
      if (err instanceof SyntaxError) continue;
      throw err;
    }
  }
  throw lastErr;
}

export type AgentTool = { name: string; description: string; schema: z.ZodType; run: (input: never) => Promise<string> };
export type AgentEvent = { type: "status"; text: string } | { type: "text"; text: string } | { type: "final"; text: string };

/**
 * A streaming tool-use loop. Text written in a round that also calls tools is
 * narration; only the last round's text is the answer.
 */
export async function* geminiAgent(opts: { system: string; history: Content[]; user: string; tools: AgentTool[]; maxRounds?: number }): AsyncGenerator<AgentEvent> {
  const byName = new Map(opts.tools.map((t) => [t.name, t]));
  const contents: Content[] = [...opts.history, { role: "user", parts: [{ text: opts.user }] }];
  const config = {
    systemInstruction: opts.system,
    tools: [{ functionDeclarations: opts.tools.map((t) => ({ name: t.name, description: t.description, parametersJsonSchema: jsonSchema(t.schema) })) }],
    maxOutputTokens: 16384,
  };
  const models = availableModels();
  let modelIdx = 0;
  let answer = "";

  for (let round = 0; round < (opts.maxRounds ?? 8); round++) {
    const parts: Part[] = [];
    let produced = false;
    let roundText = "";
    let finish: string | undefined;
    const hasNext = modelIdx < models.length - 1;
    const abort = new AbortController();
    const firstByte = hasNext ? setTimeout(() => abort.abort(), FIRST_BYTE_MS) : undefined;
    try {
      const stream = await gemini().models.generateContentStream({
        model: models[modelIdx],
        contents,
        config: { ...config, thinkingConfig: thinkingFor(models[modelIdx], "fast"), abortSignal: abort.signal },
      });
      for await (const chunk of stream) {
        clearTimeout(firstByte);
        const cand = chunk.candidates?.[0];
        finish = cand?.finishReason ?? finish;
        for (const part of cand?.content?.parts ?? []) {
          parts.push(part);
          if (part.text && !part.thought) {
            produced = true;
            roundText += part.text;
            yield { type: "text", text: part.text };
          }
          if (part.functionCall) {
            produced = true;
            yield { type: "status", text: "Searching your saves" };
          }
        }
      }
    } catch (err) {
      clearTimeout(firstByte);
      const timedOut = abort.signal.aborted;
      if ((timedOut || (err instanceof ApiError && RETRYABLE.has(err.status))) && !produced && hasNext) {
        coolDown(models[modelIdx], err instanceof ApiError ? err.status : undefined);
        modelIdx++;
        round--;
        continue;
      }
      throw err;
    }
    if (finish && /SAFETY|PROHIBITED|BLOCKLIST|SPII/.test(finish) && !roundText) throw new GeminiRefusal();

    const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall as FunctionCall);
    if (!calls.length) {
      answer = roundText;
      break;
    }
    if (roundText) yield { type: "text", text: "\n\n" };
    contents.push({ role: "model", parts });
    const responses: Part[] = [];
    for (const call of calls) {
      const t = byName.get(call.name ?? "");
      let result: string;
      if (!t) result = `Unknown tool ${call.name}.`;
      else {
        const parsed = t.schema.safeParse(call.args ?? {});
        result = parsed.success ? await t.run(parsed.data as never) : `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`;
      }
      responses.push({ functionResponse: { id: call.id, name: call.name, response: { result } } });
    }
    contents.push({ role: "user", parts: responses });
  }
  yield { type: "final", text: answer };
}

export class GeminiRefusal extends Error {}

export const geminiDebug = (...args: unknown[]) => process.env.REELMIND_DEBUG && console.info("[gemini]", ...args);

export function describeGeminiError(err: unknown): string {
  if (err instanceof GeminiRefusal) return "The AI declined to answer that one. Try rephrasing.";
  if (err instanceof ApiError) {
    if (err.status === 400 || err.status === 401 || err.status === 403) return "The Gemini API key isn't working. Check GEMINI_API_KEY in .env.local.";
    if (err.status === 429) return "The AI has hit its usage limit for now. Try again in a minute.";
    if (err.status >= 500) return "The AI is busy right now. Try again in a moment.";
    return `The AI service returned an error (${err.status}). Try again.`;
  }
  return "Something went wrong while answering. Try again.";
}
