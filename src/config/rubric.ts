import type { CategoryId, DimensionId, ObjectionCategory } from "@/types";

/**
 * PROVISIONAL rubric derived from the supplied sales checklist.
 * Weights are placeholders for the prototype — NOT approved scoring rules.
 * Replace this file (or load it from the backend) once the rubric is approved.
 */
export const RUBRIC_VERSION = "provisional-0.1";
export const SKILL_VERSION = "sales-qa-skill-mock-0.1";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  short: string;
  /** Provisional weight, percent of the overall score. Sums to 100. */
  weight: number;
  dimension: DimensionId;
  description: string;
  strength: string;
  missed: string;
  whyItMatters: string;
  shouldHaveDone: string;
  coachingAction: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "intro", label: "Introduction", short: "Intro", weight: 5, dimension: "introduction",
    description: "Greeting, name and company, and a clear purpose for the call.",
    strength: "Opened warmly, confirmed identity and set a clear agenda for the call.",
    missed: "Introduction was rushed — no clear agenda or permission to ask questions.",
    whyItMatters: "A clear opening builds credibility and lowers the prospect's guard.",
    shouldHaveDone: "State name and company, reference the enquiry, and agree the agenda before probing.",
    coachingAction: "Practise a 20-second opening script that includes agenda-setting.",
  },
  {
    id: "intent", label: "Understanding prospect intent", short: "Intent", weight: 7, dimension: "understanding",
    description: "Why the prospect enquired and what they have already tried.",
    strength: "Asked what prompted the enquiry and what the prospect had already explored.",
    missed: "Did not establish why the prospect enquired before moving on.",
    whyItMatters: "Without intent, the pitch is generic and misses the real buying trigger.",
    shouldHaveDone: "Ask what triggered the enquiry and what they have tried so far.",
    coachingAction: "Add two open 'why now' questions to the opening sequence.",
  },
  {
    id: "persona", label: "Customer persona discovery", short: "Persona", weight: 8, dimension: "discovery",
    description: "Background, profession and target customer of the prospect.",
    strength: "Captured the prospect's background and who they intend to serve.",
    missed: "Little discovery of the prospect's background or target audience.",
    whyItMatters: "Persona detail lets the salesperson tailor examples and recommend the right plan.",
    shouldHaveDone: "Ask about profession, experience and target customers before recommending anything.",
    coachingAction: "Run a role-play focused on 5 persona-discovery questions.",
  },
  {
    id: "goals", label: "Business plan and goals", short: "Goals", weight: 9, dimension: "discovery",
    description: "The prospect's plan, income goal and timeline.",
    strength: "Clarified the business plan, income goal and timeline with concrete numbers.",
    missed: "Business plan and income goal stayed vague.",
    whyItMatters: "A specific goal is the anchor for showing the value of the solution.",
    shouldHaveDone: "Ask for a target income and timeline, then repeat it back to confirm.",
    coachingAction: "Coach on quantifying goals ('how much, by when') in every call.",
  },
  {
    id: "motivation", label: "Emotional motivation and urgency", short: "Motivation", weight: 8, dimension: "discovery",
    description: "Personal reason for the goal and why it matters now.",
    strength: "Explored the personal reason behind the goal and established why now matters.",
    missed: "Emotional driver and urgency were not explored.",
    whyItMatters: "Urgency and personal motive drive follow-through after the call.",
    shouldHaveDone: "Ask what achieving the goal would change for them and what happens if they wait.",
    coachingAction: "Share a 'motivation ladder' question set and review two calls together.",
  },
  {
    id: "challenges", label: "Challenges and knowledge gaps", short: "Challenges", weight: 9, dimension: "understanding",
    description: "Current blockers and skill or knowledge gaps.",
    strength: "Surfaced current blockers and the specific knowledge gaps holding the prospect back.",
    missed: "Challenges and knowledge gaps were assumed rather than explored.",
    whyItMatters: "Naming the gaps makes the solution feel necessary rather than optional.",
    shouldHaveDone: "Ask what has stopped them so far and where they feel least confident.",
    coachingAction: "Review a strong example call and mirror its gap-probing questions.",
  },
  {
    id: "solution", label: "Solution alignment", short: "Solution", weight: 10, dimension: "understanding",
    description: "Maps product features to the prospect's stated needs.",
    strength: "Tied product features directly to the needs the prospect described.",
    missed: "Product explanation was generic and not mapped to the prospect's needs.",
    whyItMatters: "Prospects buy outcomes; unmapped features sound like a pitch.",
    shouldHaveDone: "Use the prospect's own words from discovery when presenting each feature.",
    coachingAction: "Practise 'you said… so this helps by…' phrasing.",
  },
  {
    id: "testimonials", label: "Testimonials and product knowledge", short: "Proof", weight: 6, dimension: "understanding",
    description: "Relevant proof points and accurate product knowledge.",
    strength: "Used a relevant customer story and answered product questions accurately.",
    missed: "No relevant testimonial; some product answers were vague.",
    whyItMatters: "Relevant proof reduces perceived risk, especially for trust concerns.",
    shouldHaveDone: "Pick a testimonial that matches the prospect's profile and cite specifics.",
    coachingAction: "Build a testimonial cheat-sheet organised by prospect persona.",
  },
  {
    id: "objection", label: "Objection handling", short: "Objections", weight: 12, dimension: "objection",
    description: "Acknowledges, explores and resolves objections.",
    strength: "Acknowledged the objection, explored the root cause and responded with relevant evidence.",
    missed: "Objection was dismissed or answered before the root cause was explored.",
    whyItMatters: "Unexplored objections resurface after the call and silently kill the deal.",
    shouldHaveDone: "Acknowledge, ask a clarifying question, then respond with evidence or an option.",
    coachingAction: "Role-play the top three objections using an acknowledge–explore–respond pattern.",
  },
  {
    id: "closing", label: "Closing and next steps", short: "Closing", weight: 10, dimension: "closing",
    description: "Confirms budget, asks for the decision and fixes a next step.",
    strength: "Confirmed readiness and agreed a specific next step with a date and time.",
    missed: "Call ended without a confirmed next step or a clear ask.",
    whyItMatters: "Calls without a dated next step have a much lower follow-through rate.",
    shouldHaveDone: "Summarise, ask for the decision and book a specific follow-up time.",
    coachingAction: "Introduce a closing checklist: summary, ask, next-step with time.",
  },
  {
    id: "communication", label: "Communication and listening", short: "Listening", weight: 8, dimension: "communication",
    description: "Clarity, pace, and letting the prospect speak.",
    strength: "Spoke clearly, paraphrased what the prospect said and let them finish.",
    missed: "Talked over the prospect or used unclear language at key moments.",
    whyItMatters: "Active listening is the strongest driver of trust on a first call.",
    shouldHaveDone: "Pause after questions, paraphrase answers and avoid jargon.",
    coachingAction: "Track talk-to-listen ratio in the next five calls.",
  },
  {
    id: "ethics", label: "Ethical selling and customer suitability", short: "Ethics", weight: 8, dimension: "ethics",
    description: "No exaggerated claims; checks that the offer suits the customer.",
    strength: "Set realistic expectations and checked the offer suited the prospect.",
    missed: "Made optimistic outcome statements without checking suitability.",
    whyItMatters: "Over-promising drives refunds, disputes and reputational risk.",
    shouldHaveDone: "Avoid guarantees, state realistic ranges and confirm the offer fits their situation.",
    coachingAction: "Refresh the compliant-claims guide and run a short quiz.",
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, CategoryConfig>;
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export interface DimensionConfig { id: DimensionId; label: string; description: string }
export const DIMENSIONS: DimensionConfig[] = [
  { id: "introduction", label: "Introduction", description: "Opening and agenda" },
  { id: "discovery", label: "Discovery", description: "Persona, goals and motivation" },
  { id: "understanding", label: "Customer understanding", description: "Intent, challenges, solution fit and product proof" },
  { id: "objection", label: "Objection handling", description: "Objection handling" },
  { id: "closing", label: "Closing", description: "Closing and next steps" },
  { id: "communication", label: "Communication", description: "Communication and listening" },
  { id: "ethics", label: "Ethical selling", description: "Ethical selling and suitability" },
];
export const DIMENSION_BY_ID = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d])) as Record<DimensionId, DimensionConfig>;

export interface ChecklistItem { id: string; category: CategoryId; label: string }
/** Provisional process checklist derived from the supplied sales checklist. */
export const CHECKLIST: ChecklistItem[] = [
  { id: "intro_greet", category: "intro", label: "States name and company" },
  { id: "intro_agenda", category: "intro", label: "Sets the agenda for the call" },
  { id: "intent_why", category: "intent", label: "Asks why the prospect enquired" },
  { id: "intent_prior", category: "intent", label: "Asks what they have already tried" },
  { id: "persona_background", category: "persona", label: "Captures profession and background" },
  { id: "persona_audience", category: "persona", label: "Identifies the target customer" },
  { id: "goals_plan", category: "goals", label: "Asks about the business plan" },
  { id: "goals_income", category: "goals", label: "Clarifies income goal and timeline" },
  { id: "motive_why", category: "motivation", label: "Explores the personal reason" },
  { id: "motive_urgency", category: "motivation", label: "Establishes urgency" },
  { id: "chal_current", category: "challenges", label: "Identifies current challenges" },
  { id: "chal_gaps", category: "challenges", label: "Probes knowledge and skill gaps" },
  { id: "sol_map", category: "solution", label: "Maps features to stated needs" },
  { id: "sol_outcome", category: "solution", label: "Explains how the product delivers the outcome" },
  { id: "test_proof", category: "testimonials", label: "Shares a relevant testimonial" },
  { id: "test_product", category: "testimonials", label: "Answers product questions accurately" },
  { id: "obj_listen", category: "objection", label: "Acknowledges the objection" },
  { id: "obj_explore", category: "objection", label: "Explores the root cause of the objection" },
  { id: "obj_resolve", category: "objection", label: "Responds with evidence or an option" },
  { id: "close_fin", category: "closing", label: "Confirms budget and payment readiness" },
  { id: "close_ask", category: "closing", label: "Asks for the decision" },
  { id: "close_next", category: "closing", label: "Confirms a dated next step" },
  { id: "comm_listen", category: "communication", label: "Lets the prospect finish speaking" },
  { id: "comm_clear", category: "communication", label: "Uses clear language without jargon" },
  { id: "eth_claims", category: "ethics", label: "Avoids guaranteed-income claims" },
  { id: "eth_fit", category: "ethics", label: "Checks suitability for the prospect" },
];
export const CHECKLIST_BY_ID = Object.fromEntries(CHECKLIST.map((c) => [c.id, c]));

export interface WeaknessPattern { id: string; label: string; itemIds: string[] }
export const WEAKNESS_PATTERNS: WeaknessPattern[] = [
  { id: "discovery", label: "Not asking sufficient discovery questions",
    itemIds: ["persona_background", "persona_audience", "goals_plan", "motive_why", "chal_current"] },
  { id: "objections", label: "Not exploring prospect objections", itemIds: ["obj_explore", "obj_listen"] },
  { id: "financial", label: "Missing financial qualification", itemIds: ["close_fin", "goals_income"] },
  { id: "next_step", label: "Weak next-step confirmation", itemIds: ["close_next", "close_ask"] },
  { id: "benefits", label: "Unclear explanation of product benefits", itemIds: ["sol_map", "sol_outcome", "test_product"] },
];

export const OBJECTION_CATEGORIES: { id: ObjectionCategory; label: string }[] = [
  { id: "financial", label: "Financial constraints" },
  { id: "time", label: "Lack of time" },
  { id: "suitability", label: "Product suitability" },
  { id: "trust", label: "Trust concerns" },
  { id: "decision_maker", label: "Decision-maker not present" },
  { id: "consult", label: "Need to consult someone" },
  { id: "other", label: "Other" },
];
export const OBJECTION_LABEL = Object.fromEntries(OBJECTION_CATEGORIES.map((o) => [o.id, o.label])) as Record<ObjectionCategory, string>;

/** Evaluations with at least this many calls are considered a reliable sample for averages/rankings. */
export const MIN_SAMPLE_SIZE = 5;
/** A checklist item counts as "covered" ~ probability tied to category score. */
export const GOOD_EXAMPLE_THRESHOLD = 70;
