import type { EvalStatus, GateStatus, HumanReviewStatus, Severity } from "@/types";

/** Fixed "now" so the mock dataset always lines up with date presets. */
export const MOCK_NOW_ISO = "2026-11-12T16:30:00+05:30";
export const REVIEWER_NAME = "Nikhil Rao";
export const REVIEWER_ROLE = "Sales Manager";

export const DATE_PRESETS = [
  { id: "today", label: "Today" }, { id: "yesterday", label: "Yesterday" }, { id: "last_7", label: "Last 7 days" },
  { id: "last_30", label: "Last 30 days" }, { id: "this_month", label: "This month" }, { id: "prev_month", label: "Previous month" },
  { id: "last_60", label: "Last 60 days" }, { id: "all", label: "All time" }, { id: "custom", label: "Custom range" },
] as const;

export const EVAL_STATUS_LABEL: Record<EvalStatus, string> = { evaluated: "Evaluated", held: "Held", processing: "Processing", failed: "Failed" };
export const GATE_LABEL: Record<GateStatus, string> = { pass: "Gates passed", review: "Needs acknowledgement", blocked: "Blocked" };
export const REVIEW_LABEL: Record<HumanReviewStatus, string> = { pending: "Pending human review", approved: "Approved by human", disputed: "Disputed" };
export const SEVERITY_ORDER: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
export const LANGUAGE_LABEL = { hindi: "Hindi", english: "English" } as const;

export const DURATION_BUCKETS = [
  { id: "any", label: "Any duration", min: 0, max: Infinity }, { id: "short", label: "Under 10 min", min: 0, max: 600 },
  { id: "medium", label: "10 – 25 min", min: 600, max: 1500 }, { id: "long", label: "25 – 40 min", min: 1500, max: 2400 },
  { id: "xlong", label: "Over 40 min", min: 2400, max: Infinity },
] as const;

/** Neutral sequential blue scale — no good/poor judgement, because bands are not approved. */
export function scoreColor(pct: number): string {
  const t = Math.max(0, Math.min(1, pct / 100));
  const lo = [219, 231, 251], hi = [29, 78, 216];
  return `rgb(${lo.map((c, i) => Math.round(c + (hi[i] - c) * t)).join(",")})`;
}
export const scoreInk = (pct: number) => (pct >= 55 ? "#ffffff" : "#0f172a");
