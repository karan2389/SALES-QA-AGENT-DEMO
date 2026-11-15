import { describe, expect, it } from "vitest";
import { ALL_CRITERIA, CATEGORIES, SP_CRITERIA } from "../src/config/mrv1";
import { categoryResult, computeScores, fmtScore, scoreCriteria } from "../src/lib/scoring";
import type { CriterionEval, Outcome } from "../src/types";

const crit = (id: string, categoryId: string, outcome: Outcome): CriterionEval => ({
  id, name: id, categoryId, outcome, modelOutcome: outcome, evidenceConfidence: null, quotes: [], explanation: "", review: { status: "pending" },
});
const full = (fn: (id: string, cat: string) => Outcome) => ALL_CRITERIA.map((c) => crit(c.id, c.categoryId, fn(c.id, c.categoryId)));
const sp = (o: Outcome) => SP_CRITERIA.map((c) => crit(c.id, "SP", o));

describe("rubric structure", () => {
  it("has 19 categories, 70 sales criteria and 22 SP criteria", () => {
    expect(CATEGORIES).toHaveLength(19);
    expect(ALL_CRITERIA).toHaveLength(70);
    expect(SP_CRITERIA).toHaveLength(22);
  });
});

describe("category percentage", () => {
  it("is sum / (3 × numeric criteria) × 100", () => {
    const r = scoreCriteria([{ outcome: 3 }, { outcome: 2 }, { outcome: 1 }]);
    expect(r.pct).toBeCloseTo((6 / 9) * 100);
    expect(r.scored).toBe(3);
  });
  it("excludes N/A from the denominator", () => {
    const r = scoreCriteria([{ outcome: 3 }, { outcome: "NA" }, { outcome: 3 }]);
    expect(r.pct).toBe(100);
    expect(r.na).toBe(1);
  });
  it("never counts NE as zero", () => {
    const withNe = scoreCriteria([{ outcome: 3 }, { outcome: "NE" }]);
    const withZero = scoreCriteria([{ outcome: 3 }, { outcome: 0 }]);
    expect(withNe.pct).toBe(100);
    expect(withZero.pct).toBe(50);
    expect(withNe.ne).toBe(1);
  });
  it("is null when nothing is numeric", () => {
    expect(scoreCriteria([{ outcome: "NA" }, { outcome: "NE" }]).pct).toBeNull();
  });
});

describe("sales-stage score and provisional logic", () => {
  it("is the mean of applicable category percentages", () => {
    const s = computeScores(full((_, cat) => (cat === "C01" ? 3 : 0)), sp(3));
    expect(s.stage.pct).toBeCloseTo(100 / 19);
  });
  it("is final (not provisional) when no criterion is NE", () => {
    const s = computeScores(full(() => 2), sp(2));
    expect(s.stage.provisional).toBe(false);
    expect(fmtScore(s.stage.pct, s.stage.provisional)).toBe("66.7%");
  });
  it("is provisional when at least one criterion is NE, and says so", () => {
    const s = computeScores(full((id) => (id === "C05-02" ? "NE" : 2)), sp(2));
    expect(s.stage.provisional).toBe(true);
    expect(s.stage.ne).toBe(1);
    expect(fmtScore(s.stage.pct, true)).toMatch(/\(provisional\)$/);
  });
  it("keeps the psychology score separate and independent", () => {
    const s = computeScores(full(() => 3), sp(0));
    expect(s.stage.pct).toBe(100);
    expect(s.psychology.pct).toBe(0);
  });
  it("provisional status of psychology depends only on SP criteria", () => {
    const s = computeScores(full(() => 3), [...sp(3).slice(1), crit("SP-01", "SP", "NE")]);
    expect(s.psychology.provisional).toBe(true);
    expect(s.stage.provisional).toBe(false);
  });
});

describe("continuation calls", () => {
  it("treats C01/C02 as N/A and excludes them from the stage score", () => {
    const s = computeScores(full((_, cat) => (cat === "C01" || cat === "C02" ? "NA" : 3)), sp(3));
    const c01 = s.categories.find((c) => c.id === "C01")!;
    expect(c01.pct).toBeNull();
    expect(c01.na).toBe(3);
    expect(s.stage.pct).toBe(100);
    expect(s.stage.provisional).toBe(false);
  });
  it("category result for an all-N/A category reports counts only", () => {
    const r = categoryResult("C02", full(() => "NA"));
    expect(r.scored).toBe(0);
    expect(r.na).toBe(6);
  });
});
