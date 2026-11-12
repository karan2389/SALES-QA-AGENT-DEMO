import { CATEGORIES, CATEGORY_BY_ID, CHECKLIST, DIMENSIONS, MIN_SAMPLE_SIZE, OBJECTION_CATEGORIES, WEAKNESS_PATTERNS } from "@/config/rubric";
import { OUTCOMES, SCORE_BANDS, bandFor } from "@/config/ui";
import type {
  CallRow, CategoryId, Dataset, DateRangeValue, DimensionId, Evaluation, Granularity, KpiValue, LeaderboardEntry,
  SalespersonProfile, TeamAnalytics, TrendPoint,
} from "@/types";
import { bucketOf, inRange, istDayStart, nextBucketStart, previousRange, rangeDays } from "./dates";
import { reviewReasons } from "./reviews";

export const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const round1 = (n: number) => Math.round(n * 10) / 10;

export function dimensionScore(ev: Evaluation | null, dim: DimensionId): number | null {
  if (!ev) return null;
  const cats = CATEGORIES.filter((c) => c.dimension === dim);
  return avg(cats.map((c) => ev.categoryScores[c.id].score));
}

export function buildRows(ds: Dataset): CallRow[] {
  const sp = new Map(ds.salespeople.map((s) => [s.id, s]));
  const ev = new Map(ds.evaluations.map((e) => [e.callId, e]));
  const tr = new Map(ds.transcripts.map((t) => [t.callId, t]));
  return ds.calls
    .map((call): CallRow => {
      const evaluation = ev.get(call.id) ?? null;
      const t = tr.get(call.id);
      const hasT = t && t.transcriptionStatus === "completed";
      return {
        call,
        salesperson: sp.get(call.salespersonId)!,
        evaluation,
        overall: evaluation ? evaluation.overallScore : null,
        discovery: dimensionScore(evaluation, "discovery"),
        objection: evaluation ? evaluation.categoryScores.objection.score : null,
        closing: evaluation ? evaluation.categoryScores.closing.score : null,
        transcriptionConfidence: hasT ? t.transcriptionConfidence : null,
        uncertainSegments: hasT ? t.segments.filter((s) => s.speaker === "uncertain").length : 0,
        ts: new Date(call.callDate).getTime(),
      };
    })
    .sort((a, b) => b.ts - a.ts);
}

export const inRangeRows = (rows: CallRow[], r: DateRangeValue) => rows.filter((x) => inRange(x.ts, r));
const scored = (rows: CallRow[]) => rows.filter((r): r is CallRow & { overall: number } => r.overall !== null);
export const avgOverall = (rows: CallRow[]) => avg(scored(rows).map((r) => r.overall));

const sparkBuckets = (r: DateRangeValue, rows: CallRow[], n = 8) => {
  const from = r.preset === "all" ? Math.min(...rows.map((x) => x.ts), r.to) : r.from;
  const len = (r.to - from + 1) / n;
  return Array.from({ length: n }, (_, i) => ({ from: from + i * len, to: from + (i + 1) * len }));
};

function kpi(rows: CallRow[], prev: CallRow[] | null, range: DateRangeValue, fn: (rows: CallRow[]) => number): KpiValue {
  const value = fn(rows);
  const previous = prev ? fn(prev) : null;
  const spark = sparkBuckets(range, rows).map((b) => fn(rows.filter((x) => x.ts >= b.from && x.ts <= b.to)));
  return { value, previous, delta: previous === null || (prev && prev.length === 0) ? null : value - previous, sparkline: spark };
}

const convRate = (rows: CallRow[]) => {
  const decided = rows.filter((r) => r.call.outcome !== "pending");
  return decided.length ? (decided.filter((r) => r.call.outcome === "converted").length / decided.length) * 100 : 0;
};
const procRate = (rows: CallRow[]) => {
  const done = rows.filter((r) => r.call.evaluationStatus !== "processing");
  return done.length ? (done.filter((r) => r.call.evaluationStatus !== "failed").length / done.length) * 100 : 0;
};
const needsReviewCount = (rows: CallRow[]) => rows.filter((r) => reviewReasons(r).includes("requires_review")).length;

export function trendSeries(rows: CallRow[], range: DateRangeValue, g: Granularity): TrendPoint[] {
  const ev = scored(inRangeRows(rows, range));
  const from = range.preset === "all" ? Math.min(...rows.map((r) => r.ts), range.to) : range.from;
  const map = new Map<string, number[]>();
  for (const r of ev) map.set(bucketOf(r.ts, g).key, [...(map.get(bucketOf(r.ts, g).key) ?? []), r.overall]);
  const points: TrendPoint[] = [];
  let cursor = bucketOf(from, g).start;
  let guard = 0;
  while (cursor <= range.to && guard++ < 400) {
    const b = bucketOf(cursor, g);
    const vals = map.get(b.key) ?? [];
    points.push({ key: b.key, label: b.label, avg: vals.length ? round1(avg(vals)!) : null, count: vals.length });
    cursor = nextBucketStart(cursor, g);
  }
  return points;
}

/** Fraction-based "improvement trend": current period average minus previous period average. */
export function trendDelta(spRows: CallRow[], range: DateRangeValue): number | null {
  const MIN = 2;
  if (range.preset === "all") {
    const ev = scored(spRows).sort((a, b) => a.ts - b.ts);
    if (ev.length < MIN * 2) return null;
    const mid = Math.floor(ev.length / 2);
    return avg(ev.slice(mid).map((r) => r.overall))! - avg(ev.slice(0, mid).map((r) => r.overall))!;
  }
  const cur = scored(inRangeRows(spRows, range));
  const prev = scored(inRangeRows(spRows, previousRange(range)));
  if (cur.length < MIN || prev.length < MIN) return null;
  return avg(cur.map((r) => r.overall))! - avg(prev.map((r) => r.overall))!;
}

const missedItems = (evals: Evaluation[]) =>
  CHECKLIST.map((item) => {
    const n = evals.length;
    const missed = evals.filter((e) => !e.checklist[item.id]).length;
    return { itemId: item.id, missRate: n ? missed / n : 0, n };
  }).sort((a, b) => b.missRate - a.missRate);

const objectionStats = (evals: Evaluation[]) =>
  OBJECTION_CATEGORIES.map((o) => {
    const recs = evals.flatMap((e) => e.objections).filter((x) => x.category === o.id);
    return {
      category: o.id,
      count: recs.length,
      well: recs.filter((x) => x.handling === "well").length,
      partial: recs.filter((x) => x.handling === "partial").length,
      poor: recs.filter((x) => x.handling === "poor").length,
    };
  });

export function computeTeamAnalytics(ds: Dataset, range: DateRangeValue): TeamAnalytics {
  const all = buildRows(ds);
  const rows = inRangeRows(all, range);
  const prevRange = range.preset === "all" ? null : previousRange(range);
  const prev = prevRange ? inRangeRows(all, prevRange) : null;
  const evRows = rows.filter((r) => r.evaluation);
  const evals = evRows.map((r) => r.evaluation!);
  const prevEv = prev ? prev.filter((r) => r.evaluation) : null;

  const leaderboard: LeaderboardEntry[] = ds.salespeople.map((s) => {
    const mine = all.filter((r) => r.salesperson.id === s.id);
    const inR = inRangeRows(mine, range);
    const sc = scored(inR);
    return {
      salesperson: s,
      calls: sc.length,
      avgScore: avgOverall(inR),
      converted: inR.filter((r) => r.call.outcome === "converted").length,
      trend: trendDelta(mine, range),
      lowSample: sc.length < MIN_SAMPLE_SIZE,
    };
  });

  return {
    range,
    rows: rows.length,
    kpis: {
      evaluated: kpi(evRows, prevEv, range, (x) => x.length),
      avgScore: kpi(evRows, prevEv, range, (x) => round1(avgOverall(x) ?? 0)),
      conversion: kpi(rows, prev, range, (x) => round1(convRate(x))),
      needsReview: kpi(rows, prev, range, needsReviewCount),
      processing: kpi(rows, prev, range, (x) => round1(procRate(x))),
    },
    outcomes: OUTCOMES.map((o) => ({ outcome: o.id, count: rows.filter((r) => r.call.outcome === o.id).length })),
    bands: SCORE_BANDS.map((b) => ({ id: b.id, count: evRows.filter((r) => bandFor(r.overall!).id === b.id).length })),
    leaderboard,
    trends: {
      daily: trendSeries(all, range, "daily"),
      weekly: trendSeries(all, range, "weekly"),
      monthly: trendSeries(all, range, "monthly"),
    },
    dimensions: DIMENSIONS.map((d) => {
      const cur = evRows.map((r) => dimensionScore(r.evaluation, d.id)!);
      const pv = prevEv ? prevEv.map((r) => dimensionScore(r.evaluation, d.id)!) : [];
      return { id: d.id, avg: avg(cur), previous: avg(pv), n: cur.length };
    }),
    weaknesses: WEAKNESS_PATTERNS.map((w) => {
      const affected = evals.filter((e) => w.itemIds.filter((i) => !e.checklist[i]).length / w.itemIds.length >= 0.5).length;
      return { id: w.id, label: w.label, callsAffected: affected, rate: evals.length ? affected / evals.length : 0, n: evals.length };
    }).sort((a, b) => b.rate - a.rate),
    objections: objectionStats(evals),
    adherence: CATEGORIES.map((c) => {
      const items = CHECKLIST.filter((i) => i.category === c.id);
      const total = evals.length * items.length;
      const covered = evals.reduce((a, e) => a + items.filter((i) => e.checklist[i.id]).length, 0);
      return { categoryId: c.id, rate: total ? covered / total : 0, n: evals.length };
    }),
    missedItems: missedItems(evals),
    recent: [...evRows].sort((a, b) => b.ts - a.ts).slice(0, 8),
  };
}

export function computeSalespersonProfile(ds: Dataset, id: string, range: DateRangeValue): SalespersonProfile | null {
  const salesperson = ds.salespeople.find((s) => s.id === id);
  if (!salesperson) return null;
  const mine = buildRows(ds).filter((r) => r.salesperson.id === id);
  const rows = inRangeRows(mine, range);
  const evRows = scored(rows);
  const evals = evRows.map((r) => r.evaluation!);
  const cats = CATEGORIES.map((c) => ({ id: c.id as CategoryId, avg: avg(evals.map((e) => e.categoryScores[c.id].score)) ?? 0, n: evals.length }))
    .filter(() => evals.length > 0)
    .sort((a, b) => b.avg - a.avg);
  const missed = missedItems(evals).filter((m) => m.missRate > 0);
  const objections = objectionStats(evals).map((o) => ({ category: o.category, poor: o.poor, partial: o.partial, total: o.count }))
    .filter((o) => o.poor + o.partial > 0).sort((a, b) => b.poor + b.partial - (a.poor + a.partial));
  const g: Granularity = rangeDays(range) <= 14 ? "daily" : "weekly";
  const weakest = [...cats].reverse().filter((c) => c.avg < 75).slice(0, 3);
  return {
    salesperson,
    range,
    totalCalls: rows.length,
    evaluated: evRows.length,
    avgScore: avgOverall(rows),
    trend: trendDelta(mine, range),
    lowSample: evRows.length < MIN_SAMPLE_SIZE,
    outcomes: OUTCOMES.map((o) => ({ outcome: o.id, count: rows.filter((r) => r.call.outcome === o.id).length })),
    trendSeries: trendSeries(mine, range, g),
    categories: cats,
    missedItems: missed.slice(0, 6),
    objectionGaps: objections,
    recent: rows.slice(0, 6),
    coaching: weakest.map((c) => ({
      category: c.id,
      avg: c.avg,
      action: CATEGORY_BY_ID[c.id].coachingAction,
      reason: `Averages ${Math.round(c.avg)} for ${CATEGORY_BY_ID[c.id].label.toLowerCase()} across ${c.n} evaluated call${c.n === 1 ? "" : "s"}.`,
    })),
  };
}

export { istDayStart };

export interface TeamTableRow {
  salesperson: CallRow["salesperson"];
  calls: number;
  evaluated: number;
  avgScore: number | null;
  discovery: number | null;
  objection: number | null;
  closing: number | null;
  converted: number;
  trend: number | null;
  lowSample: boolean;
}

/** One row per salesperson for the Sales Team table. Every average is paired with its evaluated-call count. */
export function teamTable(rows: CallRow[], salespeople: Dataset["salespeople"], range: DateRangeValue): TeamTableRow[] {
  return salespeople.map((s) => {
    const mine = rows.filter((r) => r.salesperson.id === s.id);
    const inR = inRangeRows(mine, range);
    const sc = scored(inR);
    return {
      salesperson: s,
      calls: inR.length,
      evaluated: sc.length,
      avgScore: avgOverall(inR),
      discovery: avg(sc.map((r) => r.discovery!)),
      objection: avg(sc.map((r) => r.objection!)),
      closing: avg(sc.map((r) => r.closing!)),
      converted: inR.filter((r) => r.call.outcome === "converted").length,
      trend: trendDelta(mine, range),
      lowSample: sc.length < MIN_SAMPLE_SIZE,
    };
  });
}
