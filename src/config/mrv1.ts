import type { CallType, FlagId, ObjectionType, Outcome, ReasonCode, Severity, TranscriptGateDecision } from "@/types";

/** Rubric definition mirroring the MRV1.0 evaluation engine (Phase 1). Replace with real rubric data later. */
export const RUBRIC_VERSION = "MRV1.0";
export const EVALUATOR_MODEL = "GPT-OSS 120B";
export const MANUAL_EVALUATOR = "Manual evaluation (not GPT-OSS)";
export const MIN_SAMPLE = 5;

export interface CriterionDef { id: string; name: string }
export interface CategoryDef { id: string; name: string; group: "1-6" | "7-12" | "13-19"; criteria: CriterionDef[] }

const cat = (id: string, name: string, group: CategoryDef["group"], names: string[]): CategoryDef => ({
  id, name, group, criteria: names.map((n, i) => ({ id: `${id}-${String(i + 1).padStart(2, "0")}`, name: n })),
});

export const CATEGORIES: CategoryDef[] = [
  cat("C01", "Introduction", "1-6", ["Greets and states name and company", "Sets purpose and agenda for the call", "Builds rapport and asks permission to proceed"]),
  cat("C02", "Understanding Intent", "1-6", ["Asks why the prospect attended the webinar", "Asks what prompted the enquiry now", "Clarifies what the prospect hopes to achieve", "Asks about the prospect's current situation", "Confirms understanding by paraphrasing", "Asks about earlier attempts at online business"]),
  cat("C03", "Customer Persona", "1-6", ["Captures occupation and background", "Identifies who the prospect wants to sell to", "Explores skills and experience"]),
  cat("C04", "Online Business Plan of Action", "1-6", ["Asks what business the prospect plans to start", "Asks which products or services they will sell", "Explores planned marketing channels", "Asks about the launch timeline"]),
  cat("C05", "Monetary Goals", "1-6", ["Asks for the target income", "Asks by when they want to reach it", "Quantifies the gap versus current income"]),
  cat("C06", "Emotional WHY", "1-6", ["Explores the personal reason behind the goal", "Connects the goal to family or lifestyle", "Reflects the emotion back to the prospect"]),
  cat("C07", "Why Now?", "7-12", ["Asks what makes this the right time", "Explores the cost of waiting", "Establishes genuine (not manufactured) urgency"]),
  cat("C08", "Plan Analysis", "7-12", ["Reviews the prospect's plan with them", "Identifies gaps in the plan", "Checks that the plan is realistic", "Summarises the plan back"]),
  cat("C09", "Challenges", "7-12", ["Asks about current challenges", "Probes the impact of each challenge", "Prioritises the biggest challenge"]),
  cat("C10", "Knowledge Gap", "7-12", ["Asks where the prospect lacks knowledge", "Assesses comfort with tools and technology", "Links gaps to the need for guidance"]),
  cat("C11", "How Will FlexiFunnels Help?", "7-12", ["Maps features to the stated challenges", "Describes how support works accurately", "Explains outcomes without exaggeration", "Checks the prospect's understanding"]),
  cat("C12", "Past Experiences", "7-12", ["Asks about previous courses or tools", "Asks what worked and what did not", "Differentiates accurately from past experiences"]),
  cat("C13", "Pain Exaggeration", "13-19", ["Highlights the cost of inaction using the prospect's own words", "Avoids exaggerating beyond what the prospect said", "Checks the emotional response respectfully"]),
  cat("C14", "Testimonials", "13-19", ["Shares a relevant testimonial", "Matches the story to the prospect's profile", "Uses genuine, verifiable proof"]),
  cat("C15", "Unique Selling Proposition (USP)", "13-19", ["States the key differentiators", "Compares fairly with alternatives", "Makes claims supported by product facts", "Explains community and support", "Explains pricing and value"]),
  cat("C16", "YES Mode", "13-19", ["Secures small agreements along the way", "Summarises the points agreed", "Confirms readiness to proceed"]),
  cat("C17", "Closing Questions", "13-19", ["Asks for the decision", "Confirms budget and payment readiness", "Offers a clear next step", "Confirms date and time for follow-up", "Explains the enrolment process clearly"]),
  cat("C18", "Objection Handling", "13-19", ["Acknowledges the objection", "Explores the root cause", "Responds with relevant evidence", "Checks whether the concern is resolved", "Respects a clear refusal"]),
  cat("C19", "Their Objections = Best Case Scenario", "13-19", ["Treats the objection as a buying signal", "Reframes the objection constructively", "Reconnects to the prospect's goal", "Re-closes after resolving the concern"]),
];
export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<string, CategoryDef>;
export const ALL_CRITERIA = CATEGORIES.flatMap((c) => c.criteria.map((k) => ({ ...k, categoryId: c.id })));

export const STAGE_GROUPS = [
  { id: "1-6", label: "Stages 1–6 (C01–C06)" },
  { id: "7-12", label: "Stages 7–12 (C07–C12)" },
  { id: "13-19", label: "Stages 13–19 (C13–C19)" },
];

export const SP_CRITERIA: CriterionDef[] = [
  "Respectful tone throughout", "Active listening", "Lets the prospect finish speaking", "Honest product claims", "No guaranteed-earnings language",
  "No manufactured urgency", "No financial pressure", "Respects a refusal", "Describes support accurately", "Uses genuine social proof",
  "No coercive emotional pressure", "Checks customer fit honestly", "Professional language", "Clear pace and articulation", "Shows empathy",
  "Confident without being arrogant", "Transparent about pricing", "Avoids unexplained jargon", "Sets realistic expectations", "Handles personal data with care",
  "Handles hesitation and silence well", "Ends the call professionally",
].map((name, i) => ({ id: `SP-${String(i + 1).padStart(2, "0")}`, name }));

export const SCALE: { value: Outcome; label: string; short: string; help: string }[] = [
  { value: 3, label: "Fully demonstrated", short: "3", help: "The behaviour was clearly and completely shown." },
  { value: 2, label: "Mostly demonstrated", short: "2", help: "Shown, with minor gaps." },
  { value: 1, label: "Weakly demonstrated", short: "1", help: "Attempted but incomplete or unclear." },
  { value: 0, label: "Not demonstrated / materially failed", short: "0", help: "Absent, or done in a way that materially failed the criterion." },
  { value: "NA", label: "Not applicable", short: "N/A", help: "The criterion does not apply to this call (reason code shown)." },
  { value: "NE", label: "Not evaluable", short: "NE", help: "Insufficient evidence to score. NE is never counted as zero." },
];

export const REASON_LABEL: Record<ReasonCode, string> = {
  call_type_not_covered: "Call type not covered", not_reached_before_call_end: "Not reached before call ended",
  transcript_unreliable: "Transcript unreliable", speaker_unclear: "Speaker unclear",
  recording_starts_midway: "Recording starts midway", insufficient_evidence: "Insufficient evidence",
};

export interface FlagDef { id: FlagId; label: string; description: string; severity: Severity; caps: { criterion: string; cap: 0 | 1 }[] }
/** Flag → score-cap table (approved). */
export const FLAGS: FlagDef[] = [
  { id: "misleading_product_claim", label: "Misleading product claim", description: "States product capabilities that are not true or are materially overstated.", severity: "high", caps: [{ criterion: "C11-03", cap: 1 }] },
  { id: "false_earnings_promise", label: "False earnings promise", description: "Promises or implies guaranteed income or specific earnings.", severity: "critical", caps: [{ criterion: "C15-03", cap: 1 }] },
  { id: "fake_urgency", label: "Fake urgency", description: "Invents deadlines or scarcity to hurry a decision.", severity: "high", caps: [{ criterion: "C07-03", cap: 1 }] },
  { id: "financial_pressure", label: "Financial pressure", description: "Pushes the prospect to spend beyond their stated means.", severity: "high", caps: [{ criterion: "C17-02", cap: 1 }] },
  { id: "refusal_not_respected", label: "Refusal not respected", description: "Continues to push after a clear refusal.", severity: "critical", caps: [{ criterion: "C18-05", cap: 0 }] },
  { id: "misrepresented_support", label: "Misrepresented support", description: "Describes support or services inaccurately.", severity: "medium", caps: [{ criterion: "C11-02", cap: 1 }] },
  { id: "fabricated_social_proof", label: "Fabricated social proof", description: "Cites testimonials or results that appear invented.", severity: "critical", caps: [{ criterion: "C14-03", cap: 0 }] },
  { id: "coercive_emotional_pressure", label: "Coercive emotional pressure", description: "Uses fear, guilt or shame to force a decision.", severity: "high", caps: [{ criterion: "C13-02", cap: 1 }] },
  { id: "unsupported_customer_fit", label: "Unsupported customer fit", description: "Asserts the offer fits the prospect without supporting evidence.", severity: "medium", caps: [{ criterion: "C11-01", cap: 1 }] },
  { id: "unprofessional_conduct", label: "Unprofessional conduct", description: "Rude, dismissive or otherwise unprofessional behaviour.", severity: "medium", caps: [] },
];
export const FLAG_BY_ID = Object.fromEntries(FLAGS.map((f) => [f.id, f])) as Record<FlagId, FlagDef>;

export const CALL_TYPES: { id: CallType; label: string; note?: string }[] = [
  { id: "new_webinar_prospect", label: "New webinar prospect", note: "a.k.a. new webinar attendee" },
  { id: "follow_up", label: "Follow-up" },
  { id: "renewal", label: "Renewal" },
  { id: "continuation", label: "Continuation", note: "C01 and C02 are N/A" },
  { id: "support_existing_customer", label: "Support (existing customer)", note: "Not scored" },
  { id: "no_conversation", label: "No conversation", note: "Not scored" },
  { id: "other_unclassified", label: "Other / unclassified" },
];
export const CALL_TYPE_LABEL = Object.fromEntries(CALL_TYPES.map((c) => [c.id, c.label])) as Record<CallType, string>;
export const UNSCORED_TYPES: CallType[] = ["support_existing_customer", "no_conversation"];

export const OBJECTION_LABEL: Record<ObjectionType, string> = {
  financial: "Financial constraints", time: "Lack of time", suitability: "Product suitability", trust: "Trust concerns",
  decision_maker: "Decision-maker not present", consult: "Need to consult someone", other: "Other",
};
export const OBJECTION_OUTCOME_LABEL = { handled_well: "Handled well", partially: "Partially handled", poorly: "Handled poorly", unclear: "Unclear" } as const;

export const GATE = {
  recordingMinRatio: 0.9,
  transcript: [
    { id: "eligible", label: "Eligible" }, { id: "incomplete_transcript", label: "Incomplete transcript" },
    { id: "suspected_language_mismatch", label: "Suspected language mismatch" }, { id: "insufficient_speech", label: "Insufficient speech" },
    { id: "corrupted_transcript", label: "Corrupted transcript" }, { id: "requires_human_review", label: "Requires human review" },
  ] as { id: TranscriptGateDecision; label: string }[],
};

/** Plain-language definitions used in tooltips across the product. */
export const TERMS = {
  provisional: "At least one criterion was Not Evaluable (NE); NE is never counted as zero.",
  ne: "Not Evaluable: there was not enough reliable evidence to score this criterion. It is excluded from the score, never counted as zero.",
  na: "Not Applicable: the criterion does not apply to this call (for example, call type not covered).",
  confidence: "How strong the supporting evidence is for this criterion (low / medium / high). It is not an accuracy percentage.",
  gate: "Checks that run before evaluation: recording length, transcript reliability and a human-confirmed call type.",
  cap: "A critical flag limits the maximum score of a related criterion. The engine's original score is shown beside the cap.",
  coverage: "Share of the logged call covered by the transcript. This is coverage, not accuracy.",
  stage: "Average of the applicable category percentages (C01–C19, counted equally; N/A categories excluded).",
  psych: "Separate Sales Psychology & Conduct scorecard (SP-01…SP-22). Never combined with the sales-stage score.",
  formula: "Category % = sum of criterion scores ÷ (3 × number of numeric criteria) × 100.",
} as const;
