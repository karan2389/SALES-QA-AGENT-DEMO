/** MRV1.0 domain types. All data is illustrative mock data. */

export type CallType =
  | "new_webinar_prospect" | "follow_up" | "renewal" | "continuation"
  | "support_existing_customer" | "no_conversation" | "other_unclassified";

/** 0–3 numeric score, N/A (not applicable) or NE (not evaluable: insufficient evidence). */
export type Outcome = 0 | 1 | 2 | 3 | "NA" | "NE";
export type NumericOutcome = 0 | 1 | 2 | 3;

export type ReasonCode =
  | "call_type_not_covered" | "not_reached_before_call_end"
  | "transcript_unreliable" | "speaker_unclear" | "recording_starts_midway" | "insufficient_evidence";

export type Speaker = "salesperson" | "prospect" | "unclear";
export type Language = "hindi" | "english";
export type EvidenceConfidence = "low" | "medium" | "high";
export type CriterionReviewStatus = "pending" | "approved" | "corrected";
export type HumanReviewStatus = "pending" | "approved" | "disputed";

export type FlagId =
  | "misleading_product_claim" | "false_earnings_promise" | "fake_urgency" | "financial_pressure"
  | "refusal_not_respected" | "misrepresented_support" | "fabricated_social_proof"
  | "coercive_emotional_pressure" | "unsupported_customer_fit" | "unprofessional_conduct";
export type Severity = "low" | "medium" | "high" | "critical";
export type FlagDecision = "pending" | "confirmed" | "dismissed";

export type EvalStatus = "evaluated" | "held" | "processing" | "failed";
export type GateStatus = "pass" | "review" | "blocked";
export type TranscriptGateDecision =
  | "eligible" | "incomplete_transcript" | "suspected_language_mismatch"
  | "insufficient_speech" | "corrupted_transcript" | "requires_human_review";

export interface Salesperson {
  id: string; name: string; role: string; team: string; avatar: string; joinedOn: string;
}

export interface Quote { speaker: Speaker; start: number; end: number; segments: number[]; text: string }
export interface AbsenceRecord { start: number; end: number; note: string }

export interface CriterionEval {
  id: string;
  name: string;
  categoryId: string;
  /** Effective outcome (after any human correction). */
  outcome: Outcome;
  /** Outcome produced by the engine (after flag cap). Never overwritten. */
  modelOutcome: Outcome;
  reasonCode?: ReasonCode;
  evidenceConfidence: EvidenceConfidence | null;
  quotes: Quote[];
  absence?: AbsenceRecord;
  explanation: string;
  improvement?: string;
  cap?: { flagId: FlagId; originalScore: NumericOutcome };
  review: { status: CriterionReviewStatus; reason?: string; by?: string; at?: string };
}

export interface FlagItem {
  id: string;
  flagId: FlagId;
  severity: Severity;
  interpretation: "confirmed" | "ambiguous";
  verification: "verified" | "needs_audio_check";
  quote: Quote;
  explanation: string;
  decision: FlagDecision;
  decidedBy?: string;
  capsCriteria: string[];
}

export interface Objection {
  type: ObjectionType;
  quote: Quote;
  handling: string;
  outcome: "handled_well" | "partially" | "poorly" | "unclear";
}
export type ObjectionType = "financial" | "time" | "suitability" | "trust" | "decision_maker" | "consult" | "other";

export interface ProfileField { label: string; value: string | null; segment: number | null }
export interface EvidenceBullet { text: string; segments: number[] }
export interface CoachingPriority { categoryId: string; issue: string; action: string; example: string; segments: number[] }

export interface CategoryResult {
  id: string; pct: number | null; scored: number; na: number; ne: number; sum: number;
}
export interface ScoreSummary {
  categories: CategoryResult[];
  stage: { pct: number | null; provisional: boolean; ne: number; na: number; scored: number };
  psychology: { pct: number | null; provisional: boolean; ne: number; na: number; scored: number };
  groups: { id: string; pct: number | null }[];
}

export interface Mrv1Document {
  metadata: { rubricVersion: string; evaluator: string; evaluatedAt: string };
  call_type: { value: CallType; confirmedBy: string | null };
  applicability: { notApplicableCategories: string[] };
  transcript_quality: { coverage: number; source: string; language: Language; brokenChars: number; speakerUncertain: boolean };
  sales_stage: CriterionEval[];
  psychology: CriterionEval[];
  scores: ScoreSummary;
  extras: {
    flags: FlagItem[];
    objections: Objection[];
    prospect_profile: ProfileField[];
    strengths: EvidenceBullet[];
    missed_opportunities: EvidenceBullet[];
    coaching_priorities: CoachingPriority[];
    executive_summary: string;
    final_coaching_note: string;
    needs_human_verification: string[];
  };
  human_review: { status: HumanReviewStatus; reviewer?: string; at?: string; notes: string[] };
  validation: { adjustments: string[]; warnings: string[]; criteriaTotal: number };
}

export interface GateInfo {
  recording: { status: GateStatus; audioSec: number; loggedSec: number };
  transcript: { decision: TranscriptGateDecision; status: GateStatus; reason: string; brokenChars: number; coverage: number; ackBy?: string; ackAt?: string };
  callType: { status: GateStatus };
}

export interface CallMeta {
  /** Callyzer call ID — the only identifier. */
  id: string;
  salespersonId: string;
  callDate: string;
  durationSec: number;
  language: Language;
  callType: CallType;
  callTypeConfirmedBy: string | null;
  phoneMasked: string;
  status: EvalStatus;
  heldReason?: string;
  gates: GateInfo;
}

export interface Segment { n: number; start: number; end: number; speaker: Speaker; text: string }
export interface TranscriptData { source: string; language: Language; segments: Segment[] }

export interface CallRecord { call: CallMeta; doc: Mrv1Document | null; transcript: TranscriptData | null }

export type ActionKind =
  | "confirm_call_type" | "ack_gate" | "flag_decision" | "approve" | "dispute" | "correct_criterion" | "note";
export interface ReviewAction {
  id: string; callId: string; at: string; by: string; kind: ActionKind; notes?: string;
  callType?: CallType; flagId?: string; decision?: FlagDecision | "needs_audio_check";
  criterionId?: string; from?: Outcome; to?: Outcome;
}

export interface Dataset { salespeople: Salesperson[]; records: CallRecord[]; actions: ReviewAction[] }

/** A call joined with derived values for tables and analytics. */
export interface Row {
  rec: CallRecord;
  call: CallMeta;
  salesperson: Salesperson;
  doc: Mrv1Document | null;
  ts: number;
  stage: number | null;
  psych: number | null;
  provisional: boolean;
  flagCount: number;
  openFlags: number;
  topSeverity: Severity | null;
  gate: GateStatus;
  review: HumanReviewStatus | null;
  c18: number | null;
}

export type DatePreset = "today" | "yesterday" | "last_7" | "last_30" | "this_month" | "prev_month" | "last_60" | "all" | "custom";
export interface DateRangeValue { preset: DatePreset; from: number; to: number }
export type Granularity = "daily" | "weekly" | "monthly";
export interface TrendPoint { key: string; label: string; stage: number | null; psych: number | null; count: number }
