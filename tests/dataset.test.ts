import { describe, expect, it } from "vitest";
import { BASE } from "../src/data/mock/generate";
import { applyActions } from "../src/lib/effective";
import { buildRows } from "../src/lib/rows";
import { computeScores } from "../src/lib/scoring";

const ds = applyActions(BASE, BASE.actions);
const rows = buildRows(ds);
const evaluated = rows.filter((r) => r.doc);

describe("mock dataset", () => {
  it("has 40–60 calls and 6–8 salespeople", () => {
    expect(ds.records.length).toBeGreaterThanOrEqual(40);
    expect(ds.records.length).toBeLessThanOrEqual(60);
    expect(ds.salespeople.length).toBeGreaterThanOrEqual(6);
  });
  it("every evaluated call has 70 sales-stage and 22 psychology criteria", () => {
    for (const r of evaluated) { expect(r.doc!.sales_stage).toHaveLength(70); expect(r.doc!.psychology).toHaveLength(22); }
  });
  it("stored scores always equal scores recomputed from criterion outcomes", () => {
    for (const r of evaluated) {
      const s = computeScores(r.doc!.sales_stage, r.doc!.psychology);
      expect(r.doc!.scores.stage.pct).toBe(s.stage.pct);
      expect(r.doc!.scores.psychology.pct).toBe(s.psychology.pct);
    }
  });
  it("includes every required scenario", () => {
    expect(rows.some((r) => r.call.callType === "continuation" && r.doc!.scores.categories[0].pct === null && r.doc!.sales_stage[0].reasonCode === "call_type_not_covered")).toBe(true);
    expect(rows.some((r) => r.doc?.sales_stage[0].reasonCode === "recording_starts_midway")).toBe(true);
    expect(rows.some((r) => r.call.language === "hindi")).toBe(true);
    expect(rows.some((r) => r.call.language === "english")).toBe(true);
    expect(rows.some((r) => r.call.gates.recording.status === "blocked" && r.call.gates.recording.audioSec === 335 && r.call.gates.recording.loggedSec === 1693)).toBe(true);
    expect(rows.some((r) => r.call.gates.transcript.decision === "corrupted_transcript" && r.call.status === "held")).toBe(true);
    expect(rows.some((r) => r.call.gates.transcript.decision === "requires_human_review" && r.call.gates.transcript.ackBy)).toBe(true);
    expect(rows.some((r) => r.call.gates.callType.status === "blocked" && r.call.status === "held")).toBe(true);
    expect(rows.some((r) => r.call.status === "failed")).toBe(true);
    expect(rows.filter((r) => r.doc && r.doc.extras.flags.length).length).toBeGreaterThanOrEqual(5);
    expect(evaluated.some((r) => r.doc!.sales_stage.some((c) => c.cap))).toBe(true);
  });
  it("starts every evaluation as pending human review unless a human acted", () => {
    const humans = new Set(BASE.actions.filter((a) => a.kind === "approve" || a.kind === "dispute").map((a) => a.callId));
    for (const r of evaluated) if (!humans.has(r.call.id)) expect(r.review).toBe("pending");
  });
  it("keeps the engine outcome when a human corrects a criterion", () => {
    const r = evaluated.find((x) => typeof x.doc!.sales_stage[7].outcome === "number")!;
    const c = r.doc!.sales_stage[7];
    const next = applyActions(BASE, [{ id: "t", callId: r.call.id, at: "2026-11-12T10:00:00.000Z", by: "T", kind: "correct_criterion", criterionId: c.id, from: c.outcome, to: 3, notes: "test" }]);
    const c2 = next.records.find((x) => x.call.id === r.call.id)!.doc!.sales_stage[7];
    expect(c2.outcome).toBe(3);
    expect(c2.modelOutcome).toBe(c.modelOutcome);
    expect(c2.review.status).toBe("corrected");
  });
  it("confirming a held call's type releases the evaluation", () => {
    const held = rows.find((r) => r.call.heldReason?.startsWith("Held — call type"))!;
    const next = applyActions(BASE, [{ id: "t", callId: held.call.id, at: "2026-11-12T10:00:00.000Z", by: "T", kind: "confirm_call_type", callType: "new_webinar_prospect" }]);
    expect(next.records.find((x) => x.call.id === held.call.id)!.call.status).toBe("evaluated");
  });
});
