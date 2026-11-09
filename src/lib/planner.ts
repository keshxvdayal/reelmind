import type { PlanTemplate } from "@/lib/types";

export type TemplateInfo = { emoji: string; title: string; blurb: string; placeholder: string; examples: string[]; instructions: string };

export const TEMPLATES: Record<PlanTemplate, TemplateInfo> = {
  trip: {
    emoji: "🧳",
    title: "Trip itinerary",
    blurb: "Day-by-day plan from your travel saves",
    placeholder: "e.g. 4 days in Lisbon in May, budget $800, love cafés and quiet beaches",
    examples: ["3 days in Goa, chill vibe", "Weekend getaway from Bangalore", "A week in Himachal on a budget"],
    instructions:
      "Write a trip itinerary. Structure: a one-line overview; then '## Day 1', '## Day 2'… each with morning / afternoon / evening bullets naming specific places from the saves; then '## Where to eat', '## Budget tips', '## Checklist' (bookings, packing). Cite the save after every place or tip that comes from one.",
  },
  workout: {
    emoji: "🏋️",
    title: "Workout week",
    blurb: "A weekly routine from your fitness saves",
    placeholder: "e.g. 4 days a week at home, 30 minutes, want stronger core and better posture",
    examples: ["4-day home workout", "Beginner gym split", "Daily 15-min mobility"],
    instructions:
      "Write a weekly workout plan. Structure: a one-line overview; then a '## Monday'… section for each training day with exercises as bullets (sets × reps or time) and rest days marked; then '## Warm-up', '## Progression' and '## Safety notes'. Use exercises from the saves and cite them.",
  },
  meals: {
    emoji: "🥗",
    title: "Meal plan",
    blurb: "A week of meals and a shopping list",
    placeholder: "e.g. vegetarian, high protein, dinners under 30 minutes for 2 people",
    examples: ["Veg weeknight dinners", "High-protein breakfasts", "Budget meal prep"],
    instructions:
      "Write a 7-day meal plan. Structure: a one-line overview; a '## Week at a glance' list with one line per day; then '## Recipes' with short steps for each recipe used; then '## Shopping list' grouped by aisle. Prefer recipes from the saves and cite them.",
  },
  study: {
    emoji: "📚",
    title: "Study plan",
    blurb: "Turn saved lessons into a learning path",
    placeholder: "e.g. learn Excel for my job in 2 weeks, 45 minutes a day",
    examples: ["Learn Excel in 2 weeks", "Public speaking practice", "Interview prep plan"],
    instructions:
      "Write a study plan. Structure: a goal line; '## Week 1', '## Week 2'… with daily bullet tasks, each linked to the saves that teach it; then '## Key lessons' (the most useful points from the saves) and '## Practice' (small exercises).",
  },
  selfcare: {
    emoji: "🌿",
    title: "Self-care routine",
    blurb: "Calm, habits and reminders from your mind saves",
    placeholder: "e.g. I overthink at night and want a calmer morning and evening routine",
    examples: ["Calm evening routine", "Beat overthinking", "Morning routine for energy"],
    instructions:
      "Write a gentle self-care routine. Structure: a warm one-line opener; '## Morning', '## During the day', '## Evening' bullet routines; '## When it gets hard' with reminders quoted or paraphrased from the saves; '## Journal prompts'. Cite saves. If they describe a crisis, suggest talking to someone they trust and a local crisis line (for example 988 in the US, 116 123 in the UK and Ireland, Tele-MANAS 14416 in India, or findahelpline.com elsewhere).",
  },
  shopping: {
    emoji: "🛍️",
    title: "Wishlist & gifts",
    blurb: "Products and gift ideas you saved",
    placeholder: "e.g. birthday gift for my sister under $40, she loves skincare",
    examples: ["Gift for mom", "Skincare wishlist", "Home decor shortlist"],
    instructions:
      "Write a shortlist. Structure: a one-line overview; '## Top picks' with each product or idea, why it fits and the save it came from; '## Also consider'; '## Where to look'. Never invent prices; say when a price wasn't in the save.",
  },
  date: {
    emoji: "💝",
    title: "Date night",
    blurb: "Plans for two from your saves",
    placeholder: "e.g. anniversary next Saturday in Mumbai, cosy and not too expensive",
    examples: ["Cosy anniversary evening", "Fun weekend date", "At-home date ideas"],
    instructions:
      "Write a date plan. Structure: a one-line vibe; '## The plan' as a timeline (time → activity → place); '## Backup ideas'; '## Little touches' (gifts, notes, music). Use places, recipes and ideas from the saves and cite them.",
  },
  custom: {
    emoji: "✨",
    title: "Anything else",
    blurb: "Describe it, and we'll plan it from your saves",
    placeholder: "e.g. plan my productive Sunday using my productivity and cooking saves",
    examples: ["Productive Sunday", "Plan a house party", "My 30-day glow-up"],
    instructions: "Write a clear, practical plan with headings and bullets, built from the saves and citing them. End with a short checklist.",
  },
};
