/** Domain types for the FlexiFunnels Call Intelligence prototype. All data is illustrative mock data. */

export type Outcome = "converted" | "unsuccessful" | "follow_up" | "pending";
export type EvaluationStatus = "processing" | "completed" | "failed" | "needs_review";
export type ReviewStatus = "not_reviewed" | "pending_review" | "approved" | "disputed";
export type Language = "hindi" | "english" | "hinglish";
export type TranscriptionStatus = "completed" | "processing" | "failed";
export type SpeakerLabel = "salesperson" | "prospect" | "uncertain";
export type ConfidenceLabel = "high" | "medium" | "low";
export type EvidenceKind = "strength" | "gap";

export type CategoryId =
  | "intro" | "intent" | "persona" | "goals" | "motivation" | "challenges"
  | "solution" | "testimonials" | "objection" | "closing" | "communication" | "ethics";

export type DimensionId =
  | "introduction" | "discovery" | "understanding" | "objection" | "closing" | "communication" | "ethics";

export type ObjectionCategory =
  | "financial" | "time" | "suitability" | "trust" | "decision_maker" | "consult" | "other";

export interface Salesperson {
  id: string;
  name: string;
  role: string;
  team: string;
  /** Avatar colour key (no real photos in the prototype). */
  avatar: string;
  joinedOn: string;
  email: string;
}

export interface Call {
  id: string;
  callyzerCallId: string;
  salespersonId: string;
  prospectName: string;
  phoneNumber: string;
  /** ISO timestamp (IST offset). */
  callDate: string;
  durationSeconds: number;
  outcome: Outcome;
  language: Language;
  recordingAvailable: boolean;
  evaluationStatus: EvaluationStatus;
  reviewStatus: ReviewStatus;
}

export interface CategoryScore {
  score: number;
  /** Original model score when a manager has corrected it. */
  originalScore?: number;
  adjustedByManager?: boolean;
}

export interface ObjectionRecord {
  category: ObjectionCategory;
  handling: "well" | "partial" | "poor";
}

export interface StrengthItem {
  category: CategoryId;
  observation: string;
  evidenceId: string;
}

export interface ImprovementItem {
  category: CategoryId;
  missed: string;
  whyItMatters: string;
  shouldHaveDone: string;
  coachingAction: string;
  evidenceId: string;
}

export interface Evaluation {
  id: string;
  callId: string;
  overallScore: number;
  /** Score before manager corrections (equals overallScore when none). */
  originalOverallScore: number;
  categoryScores: Record<CategoryId, CategoryScore>;
  strengths: StrengthItem[];
  improvementAreas: ImprovementItem[];
  /** Share (0-1) of rubric checklist items for which transcript evidence was located. NOT a quality measure. */
  evidenceCoverage: number;
  /** Model confidence (0-1) in its own evaluation. NOT a quality measure. */
  confidence: number;
  confidenceLevel: ConfidenceLabel;
  /** Checklist item id -> covered in the call. */
  checklist: Record<string, boolean>;
  objections: ObjectionRecord[];
  rubricVersion: string;
  skillVersion: string;
  evaluatedAt: string;
}

export interface TranscriptSegment {
  id: string;
  /** Seconds from call start. */
  timestamp: number;
  speaker: SpeakerLabel;
  text: string;
  speakerConfidence: number;
  /** Rubric category this segment was tagged with by the (mock) evaluator, if any. */
  category?: CategoryId;
}

export interface Transcript {
  id: string;
  callId: string;
  language: Language;
  segments: TranscriptSegment[];
  transcriptionStatus: TranscriptionStatus;
  /** Mean transcription confidence (0-1). */
  transcriptionConfidence: number;
}

export interface Evidence {
  id: string;
  evaluationId: string;
  callId: string;
  kind: EvidenceKind;
  category: CategoryId;
  timestamp: number;
  segmentId: string;
  excerpt: string;
  observation: string;
  recommendation: string;
}

export type ReviewAction = "approved" | "disputed" | "note" | "score_corrected" | "marked_for_review";

export interface ScoreCorrection {
  category: CategoryId;
  from: number;
  to: number;
}

export interface ManagerReview {
  id: string;
  callId: string;
  reviewer: string;
  status: ReviewAction;
  notes: string;
  reviewedAt: string;
  correction?: ScoreCorrection;
}

export interface CallDetail {
  call: Call;
  salesperson: Salesperson;
  evaluation: Evaluation | null;
  evidence: Evidence[];
  transcript: Transcript | null;
  reviews: ManagerReview[];
}

export interface Dataset {
  calls: Call[];
  evaluations: Evaluation[];
  salespeople: Salesperson[];
  transcripts: Transcript[];
  reviews: ManagerReview[];
}

/** A call joined with the entities needed by tables and analytics. */
export interface CallRow {
  call: Call;
  salesperson: Salesperson;
  evaluation: Evaluation | null;
  overall: number | null;
  discovery: number | null;
  objection: number | null;
  closing: number | null;
  transcriptionConfidence: number | null;
  uncertainSegments: number;
  /** Epoch ms of call start. */
  ts: number;
}

export interface UpdateReviewInput {
  callId: string;
  action: ReviewAction;
  notes?: string;
  correction?: { category: CategoryId; to: number };
  reviewer?: string;
}

export type DatePreset =
  | "today" | "yesterday" | "last_7" | "last_30" | "this_month" | "prev_month" | "last_60" | "all" | "custom";

export interface DateRangeValue {
  preset: DatePreset;
  /** Epoch ms, inclusive start (IST day start). */
  from: number;
  /** Epoch ms, inclusive end (IST day end). */
  to: number;
}

export type Granularity = "daily" | "weekly" | "monthly";

export interface TrendPoint {
  key: string;
  label: string;
  avg: number | null;
  count: number;
}

export interface KpiValue {
  value: number;
  /** null when there is no comparable previous period (e.g. "All time"). */
  previous: number | null;
  /** Delta in the metric's own unit (points for scores/rates, absolute for counts). */
  delta: number | null;
  sparkline: number[];
}

export interface LeaderboardEntry {
  salesperson: Salesperson;
  calls: number;
  avgScore: number | null;
  converted: number;
  trend: number | null;
  lowSample: boolean;
}

export interface TeamAnalytics {
  range: DateRangeValue;
  rows: number;
  kpis: {
    evaluated: KpiValue;
    avgScore: KpiValue;
    conversion: KpiValue;
    needsReview: KpiValue;
    processing: KpiValue;
  };
  outcomes: { outcome: Outcome; count: number }[];
  bands: { id: string; count: number }[];
  leaderboard: LeaderboardEntry[];
  trends: Record<Granularity, TrendPoint[]>;
  dimensions: { id: DimensionId; avg: number | null; previous: number | null; n: number }[];
  weaknesses: { id: string; label: string; callsAffected: number; rate: number; n: number }[];
  objections: { category: ObjectionCategory; count: number; well: number; partial: number; poor: number }[];
  adherence: { categoryId: CategoryId; rate: number; n: number }[];
  missedItems: { itemId: string; missRate: number; n: number }[];
  recent: CallRow[];
}

export interface SalespersonProfile {
  salesperson: Salesperson;
  range: DateRangeValue;
  totalCalls: number;
  evaluated: number;
  avgScore: number | null;
  trend: number | null;
  lowSample: boolean;
  outcomes: { outcome: Outcome; count: number }[];
  trendSeries: TrendPoint[];
  categories: { id: CategoryId; avg: number; n: number }[];
  missedItems: { itemId: string; missRate: number; n: number }[];
  objectionGaps: { category: ObjectionCategory; poor: number; partial: number; total: number }[];
  recent: CallRow[];
  coaching: { category: CategoryId; avg: number; action: string; reason: string }[];
}

export interface ReviewQueueItem {
  callId: string;
  salesperson: Salesperson;
  callDate: string;
  reasons: ReviewReason[];
  status: ReviewStatus;
  evaluationStatus: EvaluationStatus;
  priority: "high" | "medium" | "low";
}

export type ReviewReason =
  | "requires_review" | "low_confidence" | "uncertain_speaker" | "failed" | "incomplete" | "disputed";
