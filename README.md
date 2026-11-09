# ReelMind

Your memory for everything you save on Instagram.

People share a reel or post to the **ReelMind bot account** on Instagram, the same way they'd send it to a friend. ReelMind saves it, and AI (Gemini or Claude) reads the caption (and the image for posts) and files it into a section of the user's life: Travel, Fitness, Food & Recipes, Mind & Emotions, Money, and so on. Each save gets a title, summary, key points, places, products, tags and an intent ("to visit", "to cook", "to learn"…).

Months later the user can ask *"remember that travel reel I sent 4 months ago?"* or *"plan a trip from what I saved"*, either on the dashboard or by texting the bot. An AI agent searches the library (with date filters for vague time references), opens the relevant saves and answers with clickable cards for each save it used.

## Run it

```bash
cp .env.example .env.local     # add GEMINI_API_KEY (or ANTHROPIC_API_KEY)
npm install
npm run seed                   # optional: demo account with ~40 saves, collections, plans
npm run dev                    # http://localhost:3000
```

Demo login: `demo@reelmind.app` / `demo1234`.

Without an AI key the app still runs: new saves are sorted by keyword rules, and Ask and the Planner tell you to add a key. With both keys set, Claude is used; set `REELMIND_AI_PROVIDER=gemini` to force Gemini.

**Try the full Instagram flow without Meta:** sign up, open **Instagram** in the sidebar and use the **DM simulator**. It builds the same webhook payload Instagram sends and runs it through the real pipeline, including the bot's replies. Share a reel → the bot asks you to link → send your `RM-XXXXXX` code → the earlier save moves into your library → ask the bot a question.

## Pages

**Marketing site:** `/` landing, `/features`, `/pricing` (Free/Pro/Premium, monthly/yearly toggle, currency picker, comparison table), `/use-cases`, `/about`, `/contact` (form stored in the DB), `/help`, `/privacy`, `/terms`, plus `/login` and `/signup` (`?plan=pro&interval=year` goes straight to checkout).

**Dashboard (`/app`)**

| Page | What it does |
|---|---|
| `/app` | Home: ask bar, setup checklist, due reminders, try list, plan templates, sections, "Remember these?", recent saves |
| `/app/ask` | Chat with your library. Streams answers; save markers become cards; conversation history |
| `/app/planner` | AI planner: trip, workout week, meal plan, study plan, self-care, wishlist, date night or custom, built from saves (optionally from one collection). Plans are saved at `/app/planner/[id]` with copy and print |
| `/app/library` | All saves: instant filters, grid/list view, select mode with bulk move, favourite, add to collection, delete |
| `/app/sections`, `/app/sections/[slug]` | AI-made sections; one section with places, topic and intent filters, suggested asks |
| `/app/collections`, `/app/collections/[id]` | Hand-picked boards; add saves, ask about or plan from one, public share link at `/c/[token]` |
| `/app/todo` | Try list: action items from saves, plus suggestions the AI pulled out |
| `/app/reminders` | Due, upcoming and done reminders (sent as Instagram DMs on Pro) |
| `/app/places`, `/app/creators` | Every place and creator across saves, with Maps and profile links |
| `/app/insights` | Saves per month, top sections, why you save, favourite creators, forgotten saves |
| `/app/saves/[id]` | One save: summary, key points, action items → try list, places, remind me, collections, related saves, note, move, re-analyse, delete |
| `/app/connect` | Link code, connection status, DM simulator |
| `/app/digest` | Premium weekly digest: headline, highlights, new places, next 7 days, worth revisiting |
| `/app/billing` | Plan, usage, Pro/Premium checkout in USD/EUR/GBP/INR, payment history |
| `/app/settings` | Profile, password, DM preferences, export (CSV/JSON), delete account |

Press **⌘K / Ctrl+K** anywhere in the dashboard to search saves, sections and pages, or to ask the AI.

## Plans & pricing

| | Free | Pro | Premium |
|---|---|---|---|
| USD / EUR | $0 | $4.99/mo · $39/yr | $9.99/mo · $79/yr |
| GBP | £0 | £3.99/mo · £34/yr | £8.99/mo · £69/yr |
| INR | ₹0 | ₹299/mo · ₹2,499/yr | ₹599/mo · ₹4,999/yr |

Free: 50 saves, 10 questions/day, 3 collections, 3 AI plans/month. **Pro**: unlimited everything, DM answers, DM reminders, CSV/JSON export. **Premium**: everything in Pro plus the weekly digest (`/app/digest`), habits insights (heatmap, streaks, rhythm, follow-through), calendar sync (secret iCal feed at `/api/calendar/<token>`) and Markdown export.

- Prices, plans and feature gates live in `src/lib/plans.ts` (`PRICES`, `PLANS`, `FEATURE_PLAN`, `can(user, feature)`).
- Currency is picked from the `rm_currency` cookie (the currency switcher), else the CDN country header (`x-vercel-ip-country` / `cf-ipcountry`), else `Accept-Language`, else USD (`src/lib/locale.ts`).
- Paid plans are prepaid (no auto-renewal). Renewing the same plan extends it; switching plan carries unused time over, scaled by the price ratio. A background loop (`src/instrumentation.ts` → `src/lib/reminders.ts`) expires ended periods and sends due reminders every minute.
- Charging in USD/EUR/GBP needs **International payments** enabled on the Razorpay account.

## How it works

```
Instagram DM ──► /api/webhooks/instagram  (verify X-Hub-Signature-256, answer 200 at once)
                     │ after()
                     ▼
              lib/ingest.ts ── share? ──► store item ► download image ► lib/ai/classify.ts (Claude, structured output)
                     │                                    └► file into section (reuse or create) ► DM "Saved to ✈️ Travel"
                     ├─ RM- code? ──► link Instagram sender to the account, adopt earlier saves
                     └─ question? ──► lib/ai/ask.ts (Claude agent with search_saves / get_saves tools) ► DM reply
```

- **Sorting** (`src/lib/ai/classify.ts`): one `claude-opus-5-5` call per save at low effort, with structured output (`AnalysisSchema` in `src/lib/types.ts`). The user's existing sections go into the prompt so Claude reuses them instead of creating near-duplicates; `upsertSection` also merges "Travel"/"travels".
- **Answering** (`src/lib/ai/ask.ts`): a tool-runner agent. `search_saves` does weighted keyword search with section, intent and date filters (`src/lib/library.ts`); `get_saves` returns full detail. Claude cites saves as `[[save:ID]]`, which the UI renders as cards and the DM reply turns into links.
- **Safety net**: both calls use the server-side refusal fallback (`fallbacks: "default"`). If the AI call fails, the save is still stored and sorted by keywords; "Re-analyse" retries it.
- **Storage**: `data/db.json` plus images in `data/media/`. Writes go through one serialized queue. Fine for one server; see "Before launch".

## Connecting the real Instagram bot

1. Create an Instagram **professional** account for the bot (e.g. `@reelmind.ai`).
2. In [Meta for Developers](https://developers.facebook.com/), create an app and add **Instagram → API setup with Instagram login**. Add the bot account and generate an access token → `IG_ACCESS_TOKEN`. The app secret → `IG_APP_SECRET`.
3. Permissions: `instagram_business_basic`, `instagram_business_manage_messages`.
4. Webhooks: callback URL `https://YOUR_DOMAIN/api/webhooks/instagram`, verify token = `IG_VERIFY_TOKEN`, subscribe to **messages**. For local testing, expose port 3003 with a tunnel (ngrok, cloudflared) and set `APP_URL` to that URL.
5. Until Meta approves the app (App Review, *Advanced Access* for messaging), only people with a role on the app can message the bot. Add yourself as a tester to try it.

Notes on what Instagram sends: a shared reel arrives as an `ig_reel` attachment with the caption in `payload.title`; a shared post arrives as `share`. Reel video files aren't analysed, only captions and notes, so the user's note in the DM ("for our Goa trip") helps a lot. Bot replies must go out within Instagram's 24-hour messaging window, which is always true here because we only reply to messages.

## Tests

```bash
npm test     # search ranking & filters, section merging, webhook parsing, signature check, DM splitting
npm run lint
```

## Before launch

- **Payments**: set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to turn on Razorpay Checkout (orders are created server-side and the payment signature is verified before Pro is activated). Without them, upgrades apply instantly, for development only. Also add Razorpay's `payment.captured` webhook as a backup for closed browser tabs.
- **Database**: move from `data/db.json` to Postgres (and media to S3/R2) before running more than one server instance. The `mutate()` boundary in `src/lib/store.ts` is where to swap it.
- **Background jobs**: AI work runs in `after()` inside the request. On serverless hosts with short limits, move `processItem` to a queue (e.g. Inngest, BullMQ).
- **Daily question limit** is an in-memory counter that resets on restart.
- **Video understanding**: to analyse what's said in a reel, transcribe the audio (the webhook gives a temporary video URL) and add the transcript to the classify prompt.
- **Legal**: `/privacy` and `/terms` are templates; have them reviewed. Account deletion and export are built in; add Meta's data-deletion callback before App Review.
- **Password reset**: needs an email provider (e.g. Resend) to send reset links.
