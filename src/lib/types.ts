import { z } from "zod";

export type Plan = "free" | "pro";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // scrypt, "salt:hash" hex
  createdAt: string;
  plan: Plan;
  /** Code the user DMs to the bot account once, to link their Instagram. */
  linkCode: string;
  igUserId: string | null; // Instagram-scoped user id (IGSID) of the sender
  igUsername: string | null;
  linkedAt: string | null;
  prefs?: UserPrefs;
  billingInterval?: BillingInterval;
  planRenewsAt?: string | null;
};

export type BillingInterval = "month" | "year";

export type UserPrefs = {
  /** Answer questions sent to the bot in Instagram DMs. */
  dmAnswers: boolean;
  /** Confirm each save with a short DM ("Saved to ✈️ Travel"). */
  dmConfirmations: boolean;
  /** Send due reminders as Instagram DMs. */
  reminderDms: boolean;
  /** Resurface forgotten saves on the home page. */
  rediscover: boolean;
};

export const DEFAULT_PREFS: UserPrefs = { dmAnswers: true, dmConfirmations: true, reminderDms: true, rediscover: true };

export type Session = { token: string; userId: string; expiresAt: string };

export type Section = {
  id: string;
  userId: string;
  slug: string;
  name: string;
  emoji: string;
  description: string;
  createdAt: string;
};

export const INTENTS = ["learn", "do", "visit", "buy", "cook", "watch", "feel", "remember"] as const;
export type Intent = (typeof INTENTS)[number];

export const INTENT_LABEL: Record<Intent, string> = {
  learn: "To learn",
  do: "To try",
  visit: "To visit",
  buy: "To buy",
  cook: "To cook",
  watch: "To watch",
  feel: "Feel-good",
  remember: "To remember",
};

/** What the AI extracts from one saved reel or post. */
export const AnalysisSchema = z.object({
  title: z.string().describe("Short, specific title (max ~8 words) that the user would recognise, e.g. 'Hidden waterfalls near Ubud, Bali'"),
  summary: z.string().describe("1-3 sentences: what this reel/post is about and why someone would save it"),
  sectionName: z
    .string()
    .describe("Broad life-area section. Reuse an existing section name exactly when it fits; otherwise a new broad name (2-3 words)"),
  sectionEmoji: z.string().describe("One emoji for the section"),
  sectionDescription: z.string().describe("One short sentence describing what belongs in the section"),
  subtopic: z.string().describe("Narrower topic inside the section, e.g. 'Bali', 'Leg day', 'Pasta', 'Anxiety'"),
  tags: z.array(z.string()).describe("3-8 lowercase search tags, including synonyms a user might search for later"),
  intent: z.enum(INTENTS).describe("Why the user most likely saved it"),
  keyPoints: z.array(z.string()).describe("The concrete, useful content: steps, tips, ingredients, exercises, places, quotes. Empty if none"),
  actionItems: z.array(z.string()).describe("Things the user could actually do with this later. Empty if none"),
  places: z.array(z.string()).describe("Named places (cities, countries, venues). Empty if none"),
  people: z.array(z.string()).describe("Named people or creators mentioned. Empty if none"),
  products: z.array(z.string()).describe("Named products, brands, books, apps. Empty if none"),
  mood: z.string().describe("One or two words for the emotional tone, e.g. 'motivating', 'calming', 'funny'"),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export type ItemKind = "reel" | "post" | "story" | "link" | "note";
export type ItemSource = "instagram" | "manual" | "demo";
export type ItemStatus = "pending" | "ready" | "failed";

export type Item = {
  id: string;
  /** null while the Instagram sender has not linked an account yet. */
  userId: string | null;
  igSenderId: string | null;
  /** Instagram message id, so webhook retries don't create duplicates. */
  externalId: string | null;
  source: ItemSource;
  kind: ItemKind;
  url: string | null;
  /** Media stored locally (Instagram CDN URLs expire): served from /api/media/<id>. */
  hasMedia: boolean;
  caption: string;
  author: string | null;
  note: string;
  savedAt: string;
  status: ItemStatus;
  error: string | null;
  sectionId: string | null;
  analysis: Analysis | null;
  favorite: boolean;
  /** How the analysis was produced. */
  analyzedBy: "claude" | "gemini" | "keywords" | null;
  lastViewedAt?: string | null;
  viewCount?: number;
};

/** A user-made board, e.g. "Goa trip, December". Can be shared with a public link. */
export type Collection = {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  description: string;
  itemIds: string[];
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export const PLAN_TEMPLATES = ["trip", "workout", "meals", "study", "selfcare", "shopping", "date", "custom"] as const;
export type PlanTemplate = (typeof PLAN_TEMPLATES)[number];

/** An AI-written plan (trip itinerary, workout week, meal plan…) built from saves. */
export type PlanDoc = {
  id: string;
  userId: string;
  template: PlanTemplate;
  title: string;
  request: string;
  text: string;
  itemIds: string[];
  createdAt: string;
};

/** "Things to try": action items pulled from saves, or added by hand. */
export type Todo = {
  id: string;
  userId: string;
  itemId: string | null;
  text: string;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
};

export type Reminder = {
  id: string;
  userId: string;
  itemId: string;
  dueAt: string;
  note: string;
  sentAt: string | null;
  doneAt: string | null;
  createdAt: string;
};

export type Payment = {
  id: string;
  userId: string;
  plan: Plan;
  interval: BillingInterval;
  amount: number; // in paise
  currency: "INR";
  provider: "razorpay" | "dev";
  ref: string;
  status: "paid" | "created";
  at: string;
};

export type ContactMessage = { id: string; name: string; email: string; topic: string; message: string; at: string };

export type ChatMessage = { role: "user" | "assistant"; text: string; at: string };
export type Chat = { id: string; userId: string; title: string; createdAt: string; updatedAt: string; messages: ChatMessage[] };

export type WebhookLog = { at: string; kind: string; detail: string };

export type Db = {
  version: 1;
  users: User[];
  sessions: Session[];
  sections: Section[];
  items: Item[];
  chats: Chat[];
  webhookLog: WebhookLog[];
  collections: Collection[];
  plans: PlanDoc[];
  todos: Todo[];
  reminders: Reminder[];
  payments: Payment[];
  contacts: ContactMessage[];
};
