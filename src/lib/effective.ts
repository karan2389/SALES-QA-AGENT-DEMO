import { UNSCORED_TYPES } from "@/config/mrv1";
import type { CallRecord, Dataset, Mrv1Document, ReviewAction } from "@/types";
import { computeScores } from "./scoring";

const clone = <T,>(v: T): T => structuredClone(v);

function markContinuation(doc: Mrv1Document) {
  for (const c of doc.sales_stage) {
    if (c.categoryId === "C01" || c.categoryId === "C02") {
      c.outcome = "NA"; c.modelOutcome = "NA"; c.reasonCode = "call_type_not_covered"; c.quotes = []; c.absence = undefined; c.evidenceConfidence = null;
      c.explanation = "Not applicable (call type not covered). Excluded from the category percentage."; c.improvement = undefined;
    }
  }
  doc.applicability.notApplicableCategories = ["C01", "C02"];
}

/** Applies human review actions (seed + local) on top of the engine output. The engine's own outcome (`modelOutcome`) is never changed. */
export function applyActions(base: Dataset, actions: ReviewAction[]): Dataset {
  const records: CallRecord[] = base.records.map((r) => ({ call: clone(r.call), doc: r.doc ? clone(r.doc) : null, transcript: r.transcript }));
  const byId = new Map(records.map((r) => [r.call.id, r]));
  for (const a of [...actions].sort((x, y) => x.at.localeCompare(y.at))) {
    const r = byId.get(a.callId);
    if (!r) continue;
    const { call, doc } = r;
    switch (a.kind) {
      case "confirm_call_type": {
        if (!a.callType) break;
        call.callType = a.callType; call.callTypeConfirmedBy = a.by; call.gates.callType.status = "pass";
        if (doc) { doc.call_type = { value: a.callType, confirmedBy: a.by }; if (a.callType === "continuation") markContinuation(doc); }
        if (call.status === "held" && call.heldReason?.startsWith("Held — call type")) {
          if (UNSCORED_TYPES.includes(a.callType)) call.heldReason = "Call type is not scored by the sales rubric.";
          else if (doc && call.gates.transcript.status !== "review") { call.status = "evaluated"; call.heldReason = undefined; }
        }
        break;
      }
      case "ack_gate": {
        call.gates.transcript.ackBy = a.by; call.gates.transcript.ackAt = a.at; call.gates.transcript.status = "pass";
        if (call.status === "held" && call.heldReason?.startsWith("Transcript gate: requires") && doc && call.gates.callType.status === "pass") { call.status = "evaluated"; call.heldReason = undefined; }
        break;
      }
      case "flag_decision": {
        const f = doc?.extras.flags.find((x) => x.id === a.flagId);
        if (!f) break;
        if (a.decision === "needs_audio_check") f.verification = "needs_audio_check";
        else if (a.decision) { f.decision = a.decision; f.decidedBy = a.by; if (a.decision === "confirmed") f.verification = "verified"; }
        break;
      }
      case "approve": case "dispute":
        if (doc) doc.human_review = { ...doc.human_review, status: a.kind === "approve" ? "approved" : "disputed", reviewer: a.by, at: a.at, notes: a.notes ? [...doc.human_review.notes, a.notes] : doc.human_review.notes };
        break;
      case "note":
        if (doc && a.notes) doc.human_review.notes.push(a.notes);
        break;
      case "correct_criterion": {
        const c = [...(doc?.sales_stage ?? []), ...(doc?.psychology ?? [])].find((x) => x.id === a.criterionId);
        if (c && a.to !== undefined) { c.outcome = a.to; c.review = { status: "corrected", reason: a.notes, by: a.by, at: a.at }; }
        break;
      }
    }
  }
  for (const r of records) if (r.doc) r.doc.scores = computeScores(r.doc.sales_stage, r.doc.psychology);
  return { salespeople: base.salespeople, records, actions };
}
