/**
 * Demo account with ~40 pre-analysed saves spread over 8 months.
 *   npm run seed            → creates/refreshes demo@reelmind.app / demo1234
 * No API calls: the analyses are written here so the dashboard works offline.
 */
import { hashPassword } from "@/lib/auth";
import { pruneEmptySections, upsertSection } from "@/lib/library";
import { mutate, newId, newLinkCode } from "@/lib/store";
import type { Analysis, Intent, Item } from "@/lib/types";

type S = [section: string, emoji: string, desc: string];
const TRAVEL: S = ["Travel", "✈️", "Places to go, trips and travel tips"];
const FIT: S = ["Fitness", "💪", "Workouts, exercises and staying active"];
const FOOD: S = ["Food & Recipes", "🍳", "Recipes, dishes and places to eat"];
const MIND: S = ["Mind & Emotions", "🧠", "Mental health, feelings and self-care"];
const MONEY: S = ["Money", "💰", "Personal finance, investing and saving"];
const CAREER: S = ["Career & Skills", "🚀", "Work, productivity and professional skills"];
const LEARN: S = ["Learning", "📚", "Knowledge, facts and things worth knowing"];
const HOME: S = ["Home & Style", "🏡", "Home decor, fashion and grooming"];

type Seed = {
  daysAgo: number;
  s: S;
  kind?: Item["kind"];
  author: string;
  caption: string;
  title: string;
  summary: string;
  subtopic: string;
  intent: Intent;
  tags: string[];
  keyPoints?: string[];
  actionItems?: string[];
  places?: string[];
  products?: string[];
  mood?: string;
  note?: string;
  favorite?: boolean;
};

const SEEDS: Seed[] = [
  // Travel
  { daysAgo: 122, s: TRAVEL, author: "wanderwithria", caption: "3 days in Pondicherry under ₹8k 🌊 Day 1: French Quarter walk + Cafe des Arts. Day 2: Paradise Beach & Auroville. Day 3: Serenity beach sunrise. Save this for your next trip! #pondicherry #budgettravel", title: "3-day Pondicherry trip under ₹8,000", summary: "A budget 3-day Pondicherry itinerary covering the French Quarter, Paradise Beach, Auroville and a sunrise at Serenity Beach.", subtopic: "Pondicherry", intent: "visit", tags: ["pondicherry", "budget trip", "beach", "itinerary", "south india", "weekend"], keyPoints: ["Day 1: French Quarter walk and Café des Arts", "Day 2: Paradise Beach and Auroville", "Day 3: Sunrise at Serenity Beach", "Whole trip doable under ₹8,000"], actionItems: ["Book a stay in the French Quarter", "Plan for a long weekend"], places: ["Pondicherry", "French Quarter", "Paradise Beach", "Auroville", "Serenity Beach", "Café des Arts"], mood: "dreamy", favorite: true },
  { daysAgo: 118, s: TRAVEL, author: "mountainmonk", caption: "Spiti in October is unreal 🏔️ Route: Shimla → Kalpa → Tabo → Kaza → Chandratal → Manali. 8 days. Carry cash, no ATMs after Reckong Peo! #spiti #roadtrip", title: "8-day Spiti Valley road trip route", summary: "An 8-day Spiti loop from Shimla to Manali via Kalpa, Tabo, Kaza and Chandratal, best in October.", subtopic: "Spiti Valley", intent: "visit", tags: ["spiti", "himachal", "road trip", "mountains", "october", "itinerary"], keyPoints: ["Route: Shimla → Kalpa → Tabo → Kaza → Chandratal → Manali", "8 days total", "October is a great month", "Carry cash: no ATMs after Reckong Peo"], actionItems: ["Withdraw cash before Reckong Peo"], places: ["Spiti Valley", "Shimla", "Kalpa", "Tabo", "Kaza", "Chandratal", "Manali"], mood: "adventurous" },
  { daysAgo: 64, s: TRAVEL, author: "goadiaries", caption: "5 hidden cafés in North Goa you NEED to try ☕ 1. Artjuna, Anjuna 2. Bean Me Up, Vagator 3. Café Cotinga 4. Sakana 5. The Black Sheep Bistro (Panjim) #goa #cafes", title: "5 hidden cafés in North Goa", summary: "A list of five cafés worth visiting in North Goa, from Anjuna and Vagator to Panjim.", subtopic: "Goa", intent: "visit", tags: ["goa", "cafes", "coffee", "north goa", "food spots", "beach"], keyPoints: ["Artjuna, Anjuna", "Bean Me Up, Vagator", "Café Cotinga", "Sakana", "The Black Sheep Bistro, Panjim"], places: ["Goa", "Anjuna", "Vagator", "Panjim"], mood: "chill", note: "for the december goa trip with college gang" },
  { daysAgo: 40, s: TRAVEL, author: "budgetbackpacker", caption: "How I booked Bali flights for ₹14k return 🇮🇩 Use Skyscanner 'whole month' view, fly on Tuesdays, book 6-8 weeks ahead, AirAsia via KL. Visa on arrival for Indians! #bali #travelhacks", title: "Cheap Bali flights: booking tricks", summary: "Tips for finding cheap return flights to Bali from India, plus a reminder that Indians get visa on arrival.", subtopic: "Bali", intent: "learn", tags: ["bali", "flights", "travel hacks", "cheap flights", "international", "visa"], keyPoints: ["Use Skyscanner's whole-month view", "Fly on Tuesdays", "Book 6–8 weeks ahead", "AirAsia via Kuala Lumpur is often cheapest", "Visa on arrival for Indian passport holders"], actionItems: ["Set a price alert for Bali flights"], places: ["Bali", "Kuala Lumpur"], products: ["Skyscanner", "AirAsia"], mood: "practical" },
  { daysAgo: 12, s: TRAVEL, author: "kerala.tourism.fan", caption: "Monsoon in Munnar hits different 🌿☔ Stay at a tea estate bungalow, do the Lakkam waterfall walk & Eravikulam park. Best: June–Sept", title: "Munnar in monsoon: tea estates & waterfalls", summary: "Why Munnar is beautiful in the monsoon, with tea estate stays, Lakkam waterfall and Eravikulam National Park.", subtopic: "Munnar", intent: "visit", tags: ["munnar", "kerala", "monsoon", "tea estate", "waterfall", "hills"], keyPoints: ["Stay in a tea estate bungalow", "Lakkam waterfall walk", "Eravikulam National Park", "Best months: June to September"], places: ["Munnar", "Kerala", "Lakkam Waterfalls", "Eravikulam National Park"], mood: "calming" },
  { daysAgo: 200, s: TRAVEL, author: "solofemaletravels", caption: "Packing list for a 7 day trip in ONE backpack 🎒 3 tops, 2 bottoms, 1 dress, packing cubes, universal adapter, power bank, mini first aid. #packinglist", title: "One-backpack packing list for 7 days", summary: "A minimal packing list that fits a week-long trip into a single backpack.", subtopic: "Packing", intent: "do", tags: ["packing", "backpack", "travel tips", "checklist", "minimal"], keyPoints: ["3 tops, 2 bottoms, 1 dress", "Packing cubes", "Universal adapter and power bank", "Mini first-aid kit"], actionItems: ["Buy packing cubes", "Make a reusable packing checklist"], products: ["Packing cubes", "Universal adapter", "Power bank"], mood: "practical" },
  // Fitness
  { daysAgo: 150, s: FIT, author: "fitwithkabir", caption: "10 min no-equipment core burner 🔥 1. Dead bugs x 12 2. Hollow hold 30s 3. Bicycle crunch x 20 4. Plank shoulder taps x 16. Repeat 3 rounds #abs #homeworkout", title: "10-minute no-equipment core workout", summary: "A quick home core circuit with four moves repeated for three rounds.", subtopic: "Core", intent: "do", tags: ["abs", "core", "home workout", "no equipment", "10 minutes"], keyPoints: ["Dead bugs × 12", "Hollow hold 30 s", "Bicycle crunch × 20", "Plank shoulder taps × 16", "Repeat 3 rounds"], actionItems: ["Do it 3× a week after a walk"], mood: "energetic", favorite: true },
  { daysAgo: 95, s: FIT, author: "strongher.in", caption: "Glute day that actually works 🍑 Hip thrusts 4x10, Bulgarian split squats 3x8 each, RDLs 3x10, cable kickbacks 3x12. Progressive overload is the key!", title: "Glute-focused gym day", summary: "A gym leg session targeting glutes with hip thrusts, split squats, RDLs and kickbacks.", subtopic: "Legs & glutes", intent: "do", tags: ["glutes", "leg day", "gym", "hip thrust", "strength"], keyPoints: ["Hip thrusts 4×10", "Bulgarian split squats 3×8 each leg", "Romanian deadlifts 3×10", "Cable kickbacks 3×12", "Add weight gradually (progressive overload)"], mood: "motivating" },
  { daysAgo: 70, s: FIT, author: "mobilitymaster", caption: "Sit at a desk all day? Do these 5 stretches every evening 🧘 cat-cow, hip flexor lunge, thread the needle, pigeon, child's pose. 60s each.", title: "5 evening stretches for desk workers", summary: "A five-minute stretch routine to undo long hours of sitting.", subtopic: "Mobility", intent: "do", tags: ["stretching", "mobility", "back pain", "desk job", "posture", "yoga"], keyPoints: ["Cat-cow", "Hip flexor lunge", "Thread the needle", "Pigeon pose", "Child's pose", "60 seconds each"], actionItems: ["Set an 9pm reminder to stretch"], mood: "calming" },
  { daysAgo: 30, s: FIT, author: "runclubmumbai", caption: "Couch to 5K in 8 weeks 🏃 Week 1: 1 min run / 2 min walk x 8. Increase run time each week. 3 runs a week, rest days matter!", title: "Couch to 5K in 8 weeks", summary: "A beginner running plan that builds from run-walk intervals to a full 5K over eight weeks.", subtopic: "Running", intent: "do", tags: ["running", "5k", "beginner", "cardio", "plan"], keyPoints: ["Week 1: 1 min run / 2 min walk × 8", "Increase run time weekly", "3 runs per week", "Take rest days"], actionItems: ["Start week 1 on Monday"], places: ["Mumbai"], mood: "motivating" },
  { daysAgo: 8, s: FIT, author: "nutritionbyneha", caption: "High protein veg breakfast ideas 🥣 besan chilla + paneer (25g), Greek yogurt bowl (20g), soya poha (22g), sprouts salad (15g)", title: "High-protein vegetarian breakfasts", summary: "Four vegetarian breakfast ideas with their approximate protein content.", subtopic: "Protein", intent: "cook", tags: ["protein", "vegetarian", "breakfast", "diet", "fitness food"], keyPoints: ["Besan chilla with paneer ≈ 25 g", "Greek yogurt bowl ≈ 20 g", "Soya poha ≈ 22 g", "Sprouts salad ≈ 15 g"], mood: "practical" },
  // Food
  { daysAgo: 160, s: FOOD, author: "chefranveer.fan", caption: "Restaurant-style paneer butter masala at home 🧈 Ingredients: paneer 250g, tomatoes 4, cashews 10, butter 2 tbsp, kasuri methi, cream.", title: "Restaurant-style paneer butter masala", summary: "A home recipe for creamy paneer butter masala with cashew-tomato gravy.", subtopic: "Paneer", intent: "cook", tags: ["paneer", "recipe", "north indian", "curry", "dinner"], keyPoints: ["Paneer 250 g, tomatoes 4, cashews 10", "Butter 2 tbsp, kasuri methi, cream", "Blend tomato and cashew for the gravy"], mood: "comforting", favorite: true },
  { daysAgo: 110, s: FOOD, author: "15minmeals", caption: "Lazy one-pot lemon garlic pasta 🍋 spaghetti, garlic 6 cloves, lemon zest+juice, chilli flakes, parmesan, olive oil. Done in 15!", title: "15-minute lemon garlic pasta", summary: "A quick one-pot pasta with garlic, lemon, chilli and parmesan.", subtopic: "Pasta", intent: "cook", tags: ["pasta", "quick recipe", "15 minutes", "dinner", "italian"], keyPoints: ["Spaghetti, 6 garlic cloves", "Lemon zest and juice", "Chilli flakes, parmesan, olive oil", "Ready in 15 minutes"], mood: "easy" },
  { daysAgo: 75, s: FOOD, author: "delhifoodwalks", caption: "Old Delhi food trail 🥘 Jalebi Wala, Karim's, Natraj dahi bhalla, Paranthe Wali Gali, Giani's rabri faluda. Go on an empty stomach!", title: "Old Delhi food trail: 5 must-eats", summary: "Five classic Old Delhi food stops for a walking food trail.", subtopic: "Delhi street food", intent: "visit", tags: ["delhi", "street food", "old delhi", "food walk", "chandni chowk"], keyPoints: ["Old Famous Jalebi Wala", "Karim's", "Natraj dahi bhalla", "Paranthe Wali Gali", "Giani's rabri faluda"], places: ["Old Delhi", "Chandni Chowk", "Karim's", "Paranthe Wali Gali"], mood: "fun" },
  { daysAgo: 45, s: FOOD, author: "bakewithanu", caption: "Eggless chocolate mug cake in 90 seconds 🍫 4 tbsp flour, 3 tbsp sugar, 2 tbsp cocoa, 3 tbsp milk, 2 tbsp oil, pinch baking powder. Microwave 90s!", title: "90-second eggless chocolate mug cake", summary: "A quick microwave mug cake made without eggs.", subtopic: "Dessert", intent: "cook", tags: ["dessert", "mug cake", "chocolate", "eggless", "microwave", "quick"], keyPoints: ["4 tbsp flour, 3 tbsp sugar, 2 tbsp cocoa", "3 tbsp milk, 2 tbsp oil, pinch of baking powder", "Microwave 90 seconds"], mood: "cosy" },
  { daysAgo: 20, s: FOOD, author: "hyderabadibiryani", caption: "Hyderabadi chicken dum biryani — full process 🍗 marinate overnight in curd + spices, 70% cooked rice, layer, seal with dough, dum 25 min.", title: "Hyderabadi chicken dum biryani", summary: "The full process for a dum-cooked Hyderabadi chicken biryani.", subtopic: "Biryani", intent: "cook", tags: ["biryani", "chicken", "hyderabadi", "recipe", "weekend cooking"], keyPoints: ["Marinate chicken overnight in curd and spices", "Cook rice to 70%", "Layer chicken and rice", "Seal the pot with dough", "Dum for 25 minutes"], mood: "indulgent" },
  { daysAgo: 4, s: FOOD, author: "mealprepindia", caption: "Sunday meal prep for the whole week in 2 hrs 🥗 rajma, jeera rice, roasted veggies, overnight oats, chutney. Store in glass boxes.", title: "2-hour Sunday meal prep for the week", summary: "How to prep a week of Indian meals in about two hours on Sunday.", subtopic: "Meal prep", intent: "do", tags: ["meal prep", "weekly", "healthy", "rajma", "lunch box"], keyPoints: ["Rajma and jeera rice", "Roasted vegetables", "Overnight oats", "Green chutney", "Store in glass containers"], actionItems: ["Buy glass meal-prep boxes"], products: ["Glass containers"], mood: "productive" },
  // Mind
  { daysAgo: 180, s: MIND, kind: "post", author: "therapywithtara", caption: "When your mind won't stop overthinking at night, try this: write the thought down, name the feeling, ask 'is this in my control today?' If not, let it wait till morning. 🤍", title: "A 3-step fix for night-time overthinking", summary: "A simple journaling routine for when overthinking keeps you up at night.", subtopic: "Overthinking", intent: "feel", tags: ["overthinking", "anxiety", "sleep", "journaling", "mental health"], keyPoints: ["Write the thought down", "Name the feeling", "Ask: is this in my control today?", "If not, let it wait till morning"], actionItems: ["Keep a notebook by the bed"], mood: "comforting", favorite: true },
  { daysAgo: 130, s: MIND, kind: "post", author: "softlifequotes", caption: "You are allowed to outgrow people, places and versions of yourself. Growth is not betrayal. 🌱", title: "Growth is not betrayal", summary: "A reminder that outgrowing people and old versions of yourself is part of growth.", subtopic: "Self-growth", intent: "feel", tags: ["quote", "growth", "self love", "healing", "letting go"], mood: "reassuring" },
  { daysAgo: 85, s: MIND, author: "calm.with.dev", caption: "Box breathing for panic: inhale 4, hold 4, exhale 4, hold 4. Do 4 rounds. Navy SEALs use it 🫁", title: "Box breathing for panic moments", summary: "The 4-4-4-4 box breathing technique to calm down quickly.", subtopic: "Anxiety", intent: "do", tags: ["breathing", "anxiety", "panic", "calm", "stress relief"], keyPoints: ["Inhale 4 s", "Hold 4 s", "Exhale 4 s", "Hold 4 s", "Repeat 4 rounds"], mood: "calming" },
  { daysAgo: 50, s: MIND, author: "dr.mindful", caption: "Signs you're emotionally exhausted, not lazy: you sleep but wake up tired, small tasks feel huge, you cancel plans to recharge. Rest is productive.", title: "Emotional exhaustion vs. laziness", summary: "Signs that what feels like laziness may actually be emotional exhaustion.", subtopic: "Burnout", intent: "learn", tags: ["burnout", "exhaustion", "rest", "mental health", "self care"], keyPoints: ["Waking up tired despite sleep", "Small tasks feel huge", "Cancelling plans to recharge", "Rest is productive"], mood: "validating" },
  { daysAgo: 15, s: MIND, kind: "post", author: "journalprompts.daily", caption: "5 journal prompts for a heavy week: 1. What drained me? 2. What gave me energy? 3. What am I avoiding? 4. What can I let go of? 5. One kind thing for myself tomorrow.", title: "5 journal prompts for a heavy week", summary: "Five reflective journaling prompts for when a week feels heavy.", subtopic: "Journaling", intent: "do", tags: ["journaling", "prompts", "reflection", "self care", "stress"], keyPoints: ["What drained me?", "What gave me energy?", "What am I avoiding?", "What can I let go of?", "One kind thing for myself tomorrow"], mood: "gentle" },
  // Money
  { daysAgo: 140, s: MONEY, author: "financewithsharan.fan", caption: "50/30/20 rule for your first salary 💸 50% needs, 30% wants, 20% savings & investing. Automate SIP on salary day!", title: "50/30/20 budget for your first salary", summary: "How to split a salary into needs, wants and savings, and automate investing.", subtopic: "Budgeting", intent: "learn", tags: ["budget", "salary", "saving", "sip", "personal finance"], keyPoints: ["50% needs", "30% wants", "20% savings and investing", "Automate the SIP on salary day"], actionItems: ["Set up an auto-debit SIP"], mood: "practical" },
  { daysAgo: 100, s: MONEY, author: "taxsimplified", caption: "Save tax legally (old regime): 80C ₹1.5L (ELSS/PPF), 80D health insurance ₹25k, NPS extra ₹50k under 80CCD(1B), HRA. File before July 31!", title: "Legal ways to save income tax (old regime)", summary: "The main deductions under India's old tax regime and the filing deadline.", subtopic: "Tax", intent: "learn", tags: ["tax", "80c", "nps", "elss", "itr", "india"], keyPoints: ["80C up to ₹1.5 L (ELSS, PPF)", "80D health insurance up to ₹25k", "NPS extra ₹50k under 80CCD(1B)", "Claim HRA", "File before 31 July"], actionItems: ["Collect 80C proofs before March"], mood: "informative" },
  { daysAgo: 35, s: MONEY, author: "moneyminimal", caption: "Emergency fund 101: keep 6 months of expenses in a liquid fund or sweep FD, NOT in stocks. Build it before you invest.", title: "Emergency fund basics", summary: "Why to build a six-month emergency fund in a liquid instrument before investing.", subtopic: "Emergency fund", intent: "learn", tags: ["emergency fund", "savings", "liquid fund", "fd", "basics"], keyPoints: ["Keep 6 months of expenses", "Use a liquid fund or sweep-in FD", "Not in stocks", "Build it before investing"], actionItems: ["Calculate 6 months of expenses"], mood: "practical" },
  // Career
  { daysAgo: 170, s: CAREER, author: "careercoach.ananya", caption: "Answer 'Tell me about yourself' in 60s: Present (role + 1 win) → Past (how you got here) → Future (why this job). Practice out loud!", title: "Answering “Tell me about yourself”", summary: "A present-past-future structure to answer the classic interview opener in a minute.", subtopic: "Interviews", intent: "learn", tags: ["interview", "job", "tell me about yourself", "career tips"], keyPoints: ["Present: role + one win", "Past: how you got here", "Future: why this job", "Keep it to 60 seconds; practise out loud"], mood: "confident" },
  { daysAgo: 90, s: CAREER, author: "excelwizard", caption: "5 Excel shortcuts that save hours ⌨️ Ctrl+Shift+L filter, Ctrl+T table, Alt+= autosum, Ctrl+; today's date, F4 repeat action", title: "5 Excel shortcuts that save hours", summary: "Five keyboard shortcuts that speed up everyday Excel work.", subtopic: "Excel", intent: "learn", tags: ["excel", "shortcuts", "productivity", "office", "spreadsheet"], keyPoints: ["Ctrl+Shift+L: filter", "Ctrl+T: make a table", "Alt+=: AutoSum", "Ctrl+;: today's date", "F4: repeat last action"], products: ["Microsoft Excel"], mood: "useful" },
  { daysAgo: 55, s: CAREER, author: "linkedin.growth", caption: "LinkedIn headline formula: [Role] helping [who] [achieve what] | [proof]. e.g. 'Product Designer helping fintechs simplify onboarding | Ex-Razorpay'", title: "LinkedIn headline formula", summary: "A fill-in-the-blanks formula for a stronger LinkedIn headline.", subtopic: "LinkedIn", intent: "do", tags: ["linkedin", "personal branding", "headline", "job search"], keyPoints: ["[Role] helping [who] [achieve what] | [proof]", "Example: Product Designer helping fintechs simplify onboarding | Ex-Razorpay"], actionItems: ["Rewrite my LinkedIn headline"], products: ["LinkedIn"], mood: "practical" },
  { daysAgo: 22, s: CAREER, author: "deepworkdaily", caption: "The 3-3-3 method: 3 hours deep work on your most important project, 3 shorter tasks, 3 maintenance tasks. That's a productive day.", title: "The 3-3-3 productivity method", summary: "A simple daily structure: 3 hours of deep work, 3 short tasks, 3 maintenance tasks.", subtopic: "Productivity", intent: "do", tags: ["productivity", "deep work", "planning", "focus", "routine"], keyPoints: ["3 hours of deep work on the most important project", "3 shorter tasks", "3 maintenance tasks"], mood: "focused" },
  { daysAgo: 6, s: CAREER, author: "speakwithconfidence", caption: "Stop saying 'I think' in meetings. Say 'My recommendation is…' Replace 'Sorry to bother' with 'Thanks for your time'. Small words, big presence.", title: "Words that make you sound confident at work", summary: "Phrase swaps that make you sound more confident in meetings and emails.", subtopic: "Communication", intent: "learn", tags: ["communication", "confidence", "meetings", "public speaking", "work"], keyPoints: ["Swap 'I think' for 'My recommendation is…'", "Swap 'Sorry to bother' for 'Thanks for your time'"], mood: "empowering" },
  // Learning
  { daysAgo: 190, s: LEARN, author: "historyinshorts", caption: "Why is India's time zone +5:30? 🕰️ A compromise between Calcutta time and Bombay time set in 1947.", title: "Why India's time zone is UTC+5:30", summary: "The history of India's half-hour time zone as a compromise between Calcutta and Bombay time.", subtopic: "History", intent: "learn", tags: ["history", "india", "time zone", "fun fact", "ist"], places: ["India", "Kolkata", "Mumbai"], mood: "curious" },
  { daysAgo: 125, s: LEARN, author: "booksummaries.in", caption: "Atomic Habits in 60s 📘 1% better daily. Make it obvious, attractive, easy, satisfying. Habit stacking: after I [current habit], I will [new habit].", title: "Atomic Habits in 60 seconds", summary: "The core ideas of James Clear's Atomic Habits: tiny improvements and the four laws of behaviour change.", subtopic: "Books", intent: "learn", tags: ["atomic habits", "book summary", "habits", "self improvement", "james clear"], keyPoints: ["Get 1% better every day", "Make it obvious, attractive, easy and satisfying", "Habit stacking: after I [current habit], I will [new habit]"], actionItems: ["Pick one habit to stack onto morning tea"], products: ["Atomic Habits"], mood: "motivating" },
  { daysAgo: 60, s: LEARN, author: "learnenglishwithme", caption: "Stop saying 'very' 🚫 very tired → exhausted, very big → enormous, very happy → thrilled, very scared → terrified", title: "Better words than “very”", summary: "Stronger single-word replacements for common 'very + adjective' phrases.", subtopic: "English", intent: "learn", tags: ["english", "vocabulary", "writing", "language"], keyPoints: ["very tired → exhausted", "very big → enormous", "very happy → thrilled", "very scared → terrified"], mood: "useful" },
  { daysAgo: 25, s: LEARN, author: "sciencebite", caption: "Why do we get 'brain freeze'? Cold hits the roof of your mouth, blood vessels constrict then rapidly dilate → headache. Fix: press tongue to roof of mouth.", title: "What causes brain freeze (and the fix)", summary: "Why cold food triggers 'brain freeze' and a quick way to stop it.", subtopic: "Science", intent: "learn", tags: ["science", "fun fact", "brain freeze", "body"], keyPoints: ["Cold on the palate constricts then dilates blood vessels", "Fix: press your tongue to the roof of your mouth"], mood: "curious" },
  // Home & style
  { daysAgo: 155, s: HOME, kind: "post", author: "smallspacesindia", caption: "Rental-friendly room makeover under ₹5k 🛋️ warm fairy lights, a jute rug, peel-and-stick wallpaper, plants, and a big mirror to make it feel larger.", title: "Rental room makeover under ₹5,000", summary: "Cheap, renter-friendly ways to make a small room feel cosy and bigger.", subtopic: "Room decor", intent: "buy", tags: ["room decor", "rental", "budget", "cosy", "makeover"], keyPoints: ["Warm fairy lights", "Jute rug", "Peel-and-stick wallpaper", "Plants", "A large mirror to open up the space"], products: ["Fairy lights", "Jute rug", "Peel-and-stick wallpaper"], mood: "cosy" },
  { daysAgo: 80, s: HOME, author: "skincare.simplified", caption: "Minimal skincare for oily skin: gentle gel cleanser → niacinamide serum → oil-free moisturiser → SPF 50 (non-negotiable!) ☀️", title: "4-step routine for oily skin", summary: "A minimal skincare routine for oily skin, with sunscreen as the essential step.", subtopic: "Skincare", intent: "buy", tags: ["skincare", "oily skin", "niacinamide", "sunscreen", "routine"], keyPoints: ["Gentle gel cleanser", "Niacinamide serum", "Oil-free moisturiser", "SPF 50 every day"], products: ["Niacinamide serum", "SPF 50 sunscreen"], mood: "practical" },
  { daysAgo: 18, s: HOME, author: "capsulewardrobe.in", caption: "Capsule wardrobe for men: white tee, black tee, oxford shirt, dark jeans, chinos, white sneakers, overshirt. 20+ outfits from 7 pieces.", title: "7-piece capsule wardrobe for men", summary: "Seven versatile clothing pieces that combine into 20+ outfits.", subtopic: "Fashion", intent: "buy", tags: ["fashion", "capsule wardrobe", "menswear", "outfits", "minimal"], keyPoints: ["White tee, black tee, oxford shirt", "Dark jeans, chinos", "White sneakers, overshirt", "20+ outfits from 7 pieces"], products: ["White sneakers", "Oxford shirt", "Chinos"], mood: "clean" },
  { daysAgo: 2, s: TRAVEL, author: "weekendgetaways.blr", caption: "Weekend from Bangalore 🚗 Chikmagalur: coffee estate homestay, Mullayanagiri sunrise trek, Hebbe falls. 4.5 hrs drive.", title: "Chikmagalur weekend from Bangalore", summary: "A weekend getaway from Bangalore to Chikmagalur with a coffee estate stay, sunrise trek and waterfall.", subtopic: "Chikmagalur", intent: "visit", tags: ["chikmagalur", "weekend", "bangalore", "coffee estate", "trek", "waterfall"], keyPoints: ["Coffee estate homestay", "Sunrise trek at Mullayanagiri", "Hebbe Falls", "About 4.5 hours' drive from Bangalore"], places: ["Chikmagalur", "Bangalore", "Mullayanagiri", "Hebbe Falls"], mood: "refreshing" },
];

const DEMO_EMAIL = "demo@reelmind.app";

async function main() {
  await mutate((db) => {
    let user = db.users.find((u) => u.email === DEMO_EMAIL);
    if (!user) {
      user = { id: newId(), email: DEMO_EMAIL, name: "Aarav Sharma", passwordHash: hashPassword("demo1234"), createdAt: new Date(Date.now() - 210 * 86400_000).toISOString(), plan: "pro", linkCode: newLinkCode(), igUserId: null, igUsername: null, linkedAt: null };
      db.users.push(user);
    }
    const uid = user.id;
    user.plan = "pro";
    user.billingInterval = "year";
    user.planRenewsAt = new Date(Date.now() + 200 * 86400_000).toISOString();
    if (!db.payments.some((p) => p.userId === uid)) {
      db.payments.push({ id: newId(), userId: uid, plan: "pro", interval: "year", amount: 249900, currency: "INR", provider: "dev", ref: "demo-seed", status: "paid", at: new Date(Date.now() - 165 * 86400_000).toISOString() });
    }
    // Replace the demo user's library.
    db.items = db.items.filter((i) => i.userId !== uid);
    db.collections = db.collections.filter((c) => c.userId !== uid);
    db.todos = db.todos.filter((t) => t.userId !== uid);
    db.reminders = db.reminders.filter((r) => r.userId !== uid);
    db.plans = db.plans.filter((p) => p.userId !== uid);
    pruneEmptySections(db, uid);

    for (const s of SEEDS) {
      const [name, emoji, description] = s.s;
      const section = upsertSection(db, uid, name, emoji, description);
      const analysis: Analysis = {
        title: s.title,
        summary: s.summary,
        sectionName: name,
        sectionEmoji: emoji,
        sectionDescription: description,
        subtopic: s.subtopic,
        tags: s.tags,
        intent: s.intent,
        keyPoints: s.keyPoints ?? [],
        actionItems: s.actionItems ?? [],
        places: s.places ?? [],
        people: [],
        products: s.products ?? [],
        mood: s.mood ?? "",
      };
      const savedAt = new Date(Date.now() - s.daysAgo * 86400_000 - Math.floor(Math.random() * 10 * 3600_000)).toISOString();
      db.items.push({
        id: newId(),
        userId: uid,
        igSenderId: null,
        externalId: null,
        source: "demo",
        kind: s.kind ?? "reel",
        url: null,
        hasMedia: false,
        caption: s.caption,
        author: s.author,
        note: s.note ?? "",
        savedAt,
        status: "ready",
        error: null,
        sectionId: section.id,
        analysis,
        favorite: s.favorite ?? false,
        analyzedBy: null, // hand-written demo analysis
        // Some saves have been opened again, most haven't (powers Insights).
        viewCount: s.daysAgo % 3 === 0 ? 1 + (s.daysAgo % 4) : 0,
        lastViewedAt: s.daysAgo % 3 === 0 ? new Date(Date.now() - (s.daysAgo % 20) * 86400_000).toISOString() : null,
      });
    }

    // Collections, try list, reminders and a plan, so every page has something to show.
    const mine = db.items.filter((i) => i.userId === uid);
    const find = (word: string) => mine.find((i) => i.analysis!.title.toLowerCase().includes(word.toLowerCase()));
    const ids = (...words: string[]) => words.map(find).filter(Boolean).map((i) => i!.id);
    const iso = (days: number) => new Date(Date.now() + days * 86400_000).toISOString();
    db.collections.push(
      { id: newId(), userId: uid, name: "Goa trip, December", emoji: "🏖️", description: "Cafés, beaches and bookings for the year-end trip", itemIds: ids("goa", "bali", "packing"), shareToken: "demo-goa-trip", createdAt: iso(-30), updatedAt: iso(-2) },
      { id: newId(), userId: uid, name: "Healthy routine", emoji: "🌱", description: "Workouts and meals for a better routine", itemIds: ids("core", "stretch", "protein", "meal prep", "5k"), shareToken: null, createdAt: iso(-20), updatedAt: iso(-5) },
      { id: newId(), userId: uid, name: "Cook this month", emoji: "🍜", description: "", itemIds: ids("paneer", "pasta", "biryani", "mug cake"), shareToken: null, createdAt: iso(-12), updatedAt: iso(-1) },
    );
    const todo = (word: string, done: boolean) => {
      const it = find(word);
      const text = it?.analysis?.actionItems[0];
      if (it && text) db.todos.push({ id: newId(), userId: uid, itemId: it.id, text, done, doneAt: done ? iso(-3) : null, createdAt: iso(-10) });
    };
    todo("core", true);
    todo("stretch", false);
    todo("pasta", false);
    todo("emergency", false);
    todo("linkedin", true);
    db.todos.push({ id: newId(), userId: uid, itemId: null, text: "Book Goa hotel before prices jump", done: false, doneAt: null, createdAt: iso(-4) });
    const rem = (word: string, days: number, note: string) => {
      const it = find(word);
      if (it) db.reminders.push({ id: newId(), userId: uid, itemId: it.id, dueAt: iso(days), note, sentAt: null, doneAt: null, createdAt: iso(-7) });
    };
    rem("tax", -1, "Invest before 31 March");
    rem("goa", 6, "Plan the café route");
    rem("5k", 2, "Start week 1");
    const goa = find("goa");
    const packing = find("packing");
    if (goa) {
      db.plans.push({
        id: newId(),
        userId: uid,
        template: "trip",
        title: "3 chill days in North Goa",
        request: "3 days in Goa in December, cafés and quiet beaches",
        text: `A slow, café-hopping trip built around the North Goa reel you saved [[save:${goa.id}]].

## Day 1
- **Morning:** land, check in near Anjuna, brunch at **Artjuna** [[save:${goa.id}]]
- **Afternoon:** walk the Anjuna flea market area
- **Evening:** sunset at Vagator, coffee at **Bean Me Up** [[save:${goa.id}]]

## Day 2
- **Morning:** scooter to Assagao, breakfast at **Cafe Bodega** [[save:${goa.id}]]
- **Afternoon:** quiet beach time at Ashwem (my suggestion)
- **Evening:** dinner at a shack in Morjim (my suggestion)

## Day 3
- **Morning:** slow breakfast, last café of the list [[save:${goa.id}]]
- **Afternoon:** souvenirs and checkout

## Checklist
- Pack light with your one-backpack list${packing ? ` [[save:${packing.id}]]` : ""}
- Rent a scooter for 3 days
- Book stays early: December prices jump`,
        itemIds: [goa.id, ...(packing ? [packing.id] : [])],
        createdAt: iso(-3),
      });
    }
    console.log(`Seeded ${SEEDS.length} saves for ${DEMO_EMAIL} (password: demo1234)`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
