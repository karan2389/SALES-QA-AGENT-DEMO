import { CATEGORIES } from "@/config/rubric";
import { REVIEWER_NAME } from "@/config/ui";
import { BASE } from "@/data/mock/generate";
import { NOW } from "@/lib/dates";
import { computeSalespersonProfile, computeTeamAnalytics } from "@/lib/metrics";
import type {
  Call, CallDetail, CategoryId, Dataset, DateRangeValue, Evaluation, ManagerReview, ReviewStatus, Salesperson,
  SalespersonProfile, TeamAnalytics, Transcript, UpdateReviewInput,
} from "@/types";
import { addUserReview, addUserReviews, getPrototypeSettings, getUserReviews } from "./mockStore";

/**
 * Mock implementation of the repository. Every exported function mirrors a future Supabase / REST call:
 * swap this module for one that talks to the backend and keep the signatures.
 */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function gate() {
  const { slow, error } = getPrototypeSettings();
  await wait(slow ? 1600 : 180);
  if (error) throw new Error("Simulated API error (503): the call-intelligence service did not respond.");
}

const STATUS_FROM_ACTION: Partial<Record<ManagerReview["status"], ReviewStatus>> = {
  approved: "approved",
  disputed: "disputed",
  marked_for_review: "pending_review",
};

function allReviews(): ManagerReview[] {
  return [...BASE.reviews, ...getUserReviews()].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
}

function effectiveCalls(): Call[] {
  const overrides = new Map<string, ReviewStatus>();
  for (const r of getUserReviews()) {
    const s = STATUS_FROM_ACTION[r.status];
    if (s) overrides.set(r.callId, s);
  }
  return BASE.calls.map((c) => (overrides.has(c.id) ? { ...c, reviewStatus: overrides.get(c.id)! } : c));
}

function effectiveEvaluations(): Evaluation[] {
  const byCall = new Map<string, ManagerReview[]>();
  for (const r of allReviews()) if (r.correction) byCall.set(r.callId, [...(byCall.get(r.callId) ?? []), r]);
  return BASE.evaluations.map((ev) => {
    const corrections = byCall.get(ev.callId);
    if (!corrections) return ev;
    const scores = { ...ev.categoryScores };
    for (const r of corrections) {
      const c = r.correction!;
      scores[c.category] = { score: c.to, originalScore: ev.categoryScores[c.category].score, adjustedByManager: true };
    }
    const overall = Math.round(CATEGORIES.reduce((a, c) => a + (scores[c.id].score * c.weight) / 100, 0));
    return { ...ev, categoryScores: scores, overallScore: overall };
  });
}

function dataset(): Dataset {
  return {
    calls: effectiveCalls(),
    evaluations: effectiveEvaluations(),
    salespeople: BASE.salespeople,
    transcripts: BASE.transcripts,
    reviews: allReviews(),
  };
}

export async function getCalls(): Promise<Call[]> {
  await gate();
  return effectiveCalls();
}

export async function getEvaluations(): Promise<Evaluation[]> {
  await gate();
  return effectiveEvaluations();
}

export async function getSalespeople(): Promise<Salesperson[]> {
  await gate();
  return BASE.salespeople;
}

export async function getTranscripts(): Promise<Transcript[]> {
  await gate();
  return BASE.transcripts;
}

export async function getManagerReviews(callId?: string): Promise<ManagerReview[]> {
  await gate();
  const rs = allReviews();
  return callId ? rs.filter((r) => r.callId === callId) : rs;
}

/** Everything the list/analytics pages need, fetched in one round trip. */
export async function getDataset(): Promise<Dataset> {
  await gate();
  return dataset();
}

export async function getCallById(id: string): Promise<CallDetail | null> {
  await gate();
  const ds = dataset();
  const call = ds.calls.find((c) => c.id === id);
  if (!call) return null;
  const evaluation = ds.evaluations.find((e) => e.callId === id) ?? null;
  return {
    call,
    salesperson: ds.salespeople.find((s) => s.id === call.salespersonId)!,
    evaluation,
    evidence: BASE.evidence.filter((e) => e.callId === id),
    transcript: ds.transcripts.find((t) => t.callId === id) ?? null,
    reviews: ds.reviews.filter((r) => r.callId === id).sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt)),
  };
}

export async function getTeamAnalytics(range: DateRangeValue): Promise<TeamAnalytics> {
  await gate();
  return computeTeamAnalytics(dataset(), range);
}

export async function getSalespersonProfile(id: string, range: DateRangeValue): Promise<SalespersonProfile | null> {
  await gate();
  return computeSalespersonProfile(dataset(), id, range);
}

function buildReview(input: UpdateReviewInput, ev: Evaluation | undefined, seq: number): ManagerReview {
  const correction = input.correction && ev
    ? { category: input.correction.category as CategoryId, from: ev.categoryScores[input.correction.category].score, to: Math.round(input.correction.to) }
    : undefined;
  return {
    id: `REV-U${String(Date.now()).slice(-6)}${seq}`,
    callId: input.callId,
    reviewer: input.reviewer ?? REVIEWER_NAME,
    status: input.action,
    notes: input.notes?.trim() ?? "",
    reviewedAt: new Date(Math.max(Date.now(), NOW)).toISOString(),
    correction,
  };
}

function validate(input: UpdateReviewInput, ev: Evaluation | undefined) {
  if (input.action === "disputed" && !input.notes?.trim()) throw new Error("A note is required when disputing an evaluation.");
  if (input.action === "note" && !input.notes?.trim()) throw new Error("Enter a note before saving.");
  if (input.action === "score_corrected") {
    if (!ev) throw new Error("This call has no evaluation to correct.");
    const to = input.correction?.to;
    if (to === undefined || Number.isNaN(to) || to < 0 || to > 100) throw new Error("Corrected score must be between 0 and 100.");
  }
  if ((input.action === "approved" || input.action === "disputed") && !ev) throw new Error("Only evaluated calls can be approved or disputed.");
}

/** Persists a manager action to local mock state (browser only) and returns the updated call detail. */
export async function updateManagerReview(input: UpdateReviewInput): Promise<ManagerReview> {
  await gate();
  const ev = effectiveEvaluations().find((e) => e.callId === input.callId);
  validate(input, ev);
  const review = buildReview(input, ev, 0);
  addUserReview(review);
  return review;
}

/** Bulk "mark for review". Skips calls already approved/pending or without evaluation. Returns how many were flagged. */
export async function markCallsForReview(callIds: string[], notes = "Marked for review from Call Explorer."): Promise<number> {
  await gate();
  const calls = new Map(effectiveCalls().map((c) => [c.id, c]));
  const targets = callIds.filter((id) => {
    const c = calls.get(id);
    return c && c.reviewStatus !== "pending_review" && c.evaluationStatus !== "processing";
  });
  addUserReviews(targets.map((id, i) => buildReview({ callId: id, action: "marked_for_review", notes }, undefined, i)));
  return targets.length;
}
