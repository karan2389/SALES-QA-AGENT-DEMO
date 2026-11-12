import type { DatePreset, EvaluationStatus, Language, Outcome, ReviewStatus } from "@/types";

export interface ScoreBand { id: string; label: string; min: number; max: number; tone: "good" | "brand" | "warn" | "bad"; color: string }

/**
 * PROVISIONAL presentation bands. Not approved evaluation weights or final scoring rules.
 * Single source of truth for every score band shown in the product.
 */
export const SCORE_BANDS: ScoreBand[] = [
  { id: "excellent", label: "Excellent", min: 85, max: 100, tone: "good", color: "#16865a" },
  { id: "good", label: "Good", min: 70, max: 84, tone: "brand", color: "#2563eb" },
  { id: "needs_improvement", label: "Needs improvement", min: 50, max: 69, tone: "warn", color: "#d58a0b" },
  { id: "poor", label: "Poor", min: 0, max: 49, tone: "bad", color: "#c83232" },
];

export function bandFor(score: number): ScoreBand {
  const s = Math.round(score);
  return SCORE_BANDS.find((b) => s >= b.min && s <= b.max) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

/** Outcome palette is intentionally NOT green/red so it is never read as a quality judgement. */
export const OUTCOMES: { id: Outcome; label: string; color: string }[] = [
  { id: "converted", label: "Converted", color: "#0f8b8d" },
  { id: "unsuccessful", label: "Unsuccessful", color: "#64748b" },
  { id: "follow_up", label: "Follow-up required", color: "#6d5bd0" },
  { id: "pending", label: "Pending", color: "#b6bfcc" },
];
export const OUTCOME_BY_ID = Object.fromEntries(OUTCOMES.map((o) => [o.id, o])) as Record<Outcome, (typeof OUTCOMES)[number]>;

export const EVALUATION_STATUSES: { id: EvaluationStatus; label: string }[] = [
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
  { id: "needs_review", label: "Needs review" },
];
export const REVIEW_STATUSES: { id: ReviewStatus; label: string }[] = [
  { id: "not_reviewed", label: "Not reviewed" },
  { id: "pending_review", label: "Pending review" },
  { id: "approved", label: "Approved" },
  { id: "disputed", label: "Disputed" },
];
export const LANGUAGES: { id: Language; label: string }[] = [
  { id: "hindi", label: "Hindi" },
  { id: "english", label: "English" },
  { id: "hinglish", label: "Hinglish" },
];
export const LANGUAGE_LABEL = Object.fromEntries(LANGUAGES.map((l) => [l.id, l.label])) as Record<Language, string>;
export const EVAL_LABEL = Object.fromEntries(EVALUATION_STATUSES.map((l) => [l.id, l.label])) as Record<EvaluationStatus, string>;
export const REVIEW_LABEL = Object.fromEntries(REVIEW_STATUSES.map((l) => [l.id, l.label])) as Record<ReviewStatus, string>;

export const DURATION_BUCKETS = [
  { id: "any", label: "Any duration", min: 0, max: Infinity },
  { id: "short", label: "Under 5 min", min: 0, max: 300 },
  { id: "medium", label: "5 – 15 min", min: 300, max: 900 },
  { id: "long", label: "15 – 30 min", min: 900, max: 1800 },
  { id: "xlong", label: "Over 30 min", min: 1800, max: Infinity },
] as const;

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7", label: "Last 7 days" },
  { id: "last_30", label: "Last 30 days" },
  { id: "this_month", label: "This month" },
  { id: "prev_month", label: "Previous month" },
  { id: "last_60", label: "Last 60 days" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom range" },
];

/** Fixed "now" so the mock dataset always lines up with date presets. */
export const MOCK_NOW_ISO = "2026-11-12T16:30:00+05:30";
export const REVIEWER_NAME = "Nikhil Rao";
export const REVIEWER_ROLE = "Sales Manager";
