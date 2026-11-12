import type { CallRow, ReviewQueueItem, ReviewReason } from "@/types";

export const REASON_LABEL: Record<ReviewReason, string> = {
  requires_review: "Requires manager review",
  low_confidence: "Low-confidence transcript / evaluation",
  uncertain_speaker: "Uncertain speaker attribution",
  failed: "Evaluation failed",
  incomplete: "Processing incomplete",
  disputed: "Evaluation disputed",
};

/** Why (if at all) a call needs a manager's attention. Approved calls leave review-driven queues. */
export function reviewReasons(row: CallRow): ReviewReason[] {
  const { call, evaluation } = row;
  const reasons: ReviewReason[] = [];
  const approved = call.reviewStatus === "approved";
  if (call.evaluationStatus === "failed") reasons.push("failed");
  if (call.evaluationStatus === "processing") reasons.push("incomplete");
  if (approved) return reasons;
  if (call.reviewStatus === "disputed") reasons.push("disputed");
  if (call.reviewStatus === "pending_review" || call.evaluationStatus === "needs_review") reasons.push("requires_review");
  if (evaluation && (evaluation.confidenceLevel === "low" || (row.transcriptionConfidence ?? 1) < 0.7)) reasons.push("low_confidence");
  if (row.uncertainSegments >= 3) reasons.push("uncertain_speaker");
  return reasons;
}

export function priorityFor(reasons: ReviewReason[]): ReviewQueueItem["priority"] {
  if (reasons.includes("disputed") || reasons.includes("failed")) return "high";
  if (reasons.includes("low_confidence") && reasons.includes("requires_review")) return "high";
  if (reasons.some((r) => r === "requires_review" || r === "low_confidence" || r === "uncertain_speaker")) return "medium";
  return "low";
}

export function buildReviewQueue(rows: CallRow[]): ReviewQueueItem[] {
  const order = { high: 0, medium: 1, low: 2 } as const;
  return rows
    .map((r) => ({ r, reasons: reviewReasons(r) }))
    .filter((x) => x.reasons.length > 0)
    .map(({ r, reasons }): ReviewQueueItem => ({
      callId: r.call.id,
      salesperson: r.salesperson,
      callDate: r.call.callDate,
      reasons,
      status: r.call.reviewStatus,
      evaluationStatus: r.call.evaluationStatus,
      priority: priorityFor(reasons),
    }))
    .sort((a, b) => order[a.priority] - order[b.priority] || b.callDate.localeCompare(a.callDate));
}
