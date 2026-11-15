import { CATEGORIES } from "@/config/mrv1";
import type { CategoryResult, CriterionEval, NumericOutcome, Outcome, ScoreSummary } from "@/types";

export const isNumeric = (o: Outcome): o is NumericOutcome => typeof o === "number";

const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Category % = sum ÷ (3 × numeric criteria) × 100. N/A and NE are excluded (NE is never zero). */
export function scoreCriteria(criteria: Pick<CriterionEval, "outcome">[]) {
  const numeric = criteria.filter((c) => isNumeric(c.outcome)).map((c) => c.outcome as NumericOutcome);
  const sum = numeric.reduce<number>((a, b) => a + b, 0);
  return {
    pct: numeric.length ? (sum / (3 * numeric.length)) * 100 : null,
    scored: numeric.length,
    na: criteria.filter((c) => c.outcome === "NA").length,
    ne: criteria.filter((c) => c.outcome === "NE").length,
    sum,
  };
}

export function categoryResult(id: string, criteria: CriterionEval[]): CategoryResult {
  return { id, ...scoreCriteria(criteria.filter((c) => c.categoryId === id)) };
}

/**
 * Two separate scores that are never combined:
 *  - stage: mean of applicable category percentages (counted equally)
 *  - psychology: its own scorecard (SP-01…SP-22)
 * A score is provisional when at least one of its criteria is Not Evaluable.
 */
export function computeScores(sales: CriterionEval[], psych: CriterionEval[]): ScoreSummary {
  const categories = CATEGORIES.map((c) => categoryResult(c.id, sales));
  const stagePcts = categories.map((c) => c.pct).filter((p): p is number => p !== null);
  const sp = scoreCriteria(psych);
  const all = scoreCriteria(sales);
  return {
    categories,
    stage: { pct: mean(stagePcts), provisional: all.ne > 0, ne: all.ne, na: all.na, scored: all.scored },
    psychology: { pct: sp.pct, provisional: sp.ne > 0, ne: sp.ne, na: sp.na, scored: sp.scored },
    groups: ["1-6", "7-12", "13-19"].map((g) => ({
      id: g,
      pct: mean(categories.filter((c) => CATEGORIES.find((d) => d.id === c.id)!.group === g).map((c) => c.pct).filter((p): p is number => p !== null)),
    })),
  };
}

export const fmtPct = (p: number | null, digits = 1) => (p === null ? "—" : `${p.toFixed(digits)}%`);
/** "58.6% (provisional)" unless no criterion was Not Evaluable. */
export const fmtScore = (p: number | null, provisional: boolean) => (p === null ? "—" : `${p.toFixed(1)}%${provisional ? " (provisional)" : ""}`);
export const outcomeLabel = (o: Outcome) => (o === "NA" ? "N/A" : String(o));
