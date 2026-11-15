import { ALL_CRITERIA, CATEGORIES, FLAGS, MIN_SAMPLE } from "@/config/mrv1";
import { SEVERITY_ORDER } from "@/config/ui";
import type { CallType, DateRangeValue, FlagId, Granularity, ObjectionType, ReasonCode, Row, Salesperson, TrendPoint } from "@/types";
import { bucketOf, inRange, nextBucketStart, previousRange } from "./dates";
import { isNumeric } from "./scoring";

export const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const inRangeRows = (rows: Row[], r: DateRangeValue) => rows.filter((x) => inRange(x.ts, r));
export const evaluatedRows = (rows: Row[]) => rows.filter((r) => r.doc);

const stageAvg = (rows: Row[]) => avg(rows.filter((r) => r.stage !== null).map((r) => r.stage!));
const psychAvg = (rows: Row[]) => avg(rows.filter((r) => r.psych !== null).map((r) => r.psych!));

export function trendSeries(rows: Row[], range: DateRangeValue, g: Granularity): TrendPoint[] {
  const ev = evaluatedRows(inRangeRows(rows, range));
  const from = range.preset === "all" ? Math.min(...rows.map((r) => r.ts), range.to) : range.from;
  const map = new Map<string, Row[]>();
  for (const r of ev) { const k = bucketOf(r.ts, g).key; map.set(k, [...(map.get(k) ?? []), r]); }
  const out: TrendPoint[] = [];
  let cur = bucketOf(from, g).start, guard = 0;
  while (cur <= range.to && guard++ < 400) {
    const b = bucketOf(cur, g);
    const rs = map.get(b.key) ?? [];
    out.push({ key: b.key, label: b.label, stage: rs.length ? round(stageAvg(rs)) : null, psych: rs.length ? round(psychAvg(rs)) : null, count: rs.length });
    cur = nextBucketStart(cur, g);
  }
  return out;
}
const round = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

export interface Kpi { value: number | null; previous: number | null; delta: number | null }
const kpi = (cur: number | null, prev: number | null, hasPrev: boolean): Kpi => ({ value: cur, previous: hasPrev ? prev : null, delta: hasPrev && cur !== null && prev !== null ? cur - prev : null });

export interface Overview {
  evaluated: Kpi; held: Kpi; stage: Kpi; psych: Kpi; openFlags: Kpi; pendingReview: Kpi;
  callTypes: { type: CallType; count: number }[];
  statuses: { status: string; count: number }[];
  histogram: { bucket: string; count: number }[];
  salespeople: SalespersonSummary[];
  trends: Record<Granularity, TrendPoint[]>;
  recent: Row[];
  provisionalShare: number | null;
}

export interface SalespersonSummary {
  salesperson: Salesperson; calls: number; evaluated: number; stage: number | null; psych: number | null; flags: number; topSeverity: Row["topSeverity"]; neRate: number | null; lowSample: boolean;
}

export function summarisePeople(rows: Row[], people: Salesperson[]): SalespersonSummary[] {
  return people.map((s) => {
    const mine = rows.filter((r) => r.salesperson.id === s.id);
    const ev = evaluatedRows(mine);
    const crit = ev.flatMap((r) => r.doc!.sales_stage);
    return {
      salesperson: s, calls: mine.length, evaluated: ev.length, stage: stageAvg(ev), psych: psychAvg(ev), flags: ev.reduce((a, r) => a + r.flagCount, 0),
      topSeverity: ev.reduce<Row["topSeverity"]>((m, r) => (r.topSeverity && (!m || SEVERITY_ORDER[r.topSeverity] > SEVERITY_ORDER[m]) ? r.topSeverity : m), null),
      neRate: crit.length ? crit.filter((c) => c.outcome === "NE").length / crit.length : null, lowSample: ev.length < MIN_SAMPLE,
    };
  });
}

export function overview(all: Row[], people: Salesperson[], range: DateRangeValue): Overview {
  const rows = inRangeRows(all, range);
  const hasPrev = range.preset !== "all";
  const prev = hasPrev ? inRangeRows(all, previousRange(range)) : [];
  const kpis = (rs: Row[]) => ({
    evaluated: evaluatedRows(rs).length, held: rs.filter((r) => r.call.status === "held").length, stage: stageAvg(rs), psych: psychAvg(rs),
    openFlags: evaluatedRows(rs).reduce((a, r) => a + r.openFlags, 0), pendingReview: evaluatedRows(rs).filter((r) => r.review === "pending").length,
  });
  const c = kpis(rows), p = kpis(prev);
  const ev = evaluatedRows(rows);
  const types = new Map<CallType, number>();
  rows.forEach((r) => types.set(r.call.callType, (types.get(r.call.callType) ?? 0) + 1));
  const hist = Array.from({ length: 10 }, (_, i) => ({ bucket: i === 9 ? "90–100" : `${i * 10}–${i * 10 + 9}`, count: 0 }));
  ev.forEach((r) => { if (r.stage !== null) hist[Math.min(9, Math.floor(r.stage / 10))].count++; });
  return {
    evaluated: kpi(c.evaluated, p.evaluated, hasPrev), held: kpi(c.held, p.held, hasPrev), stage: kpi(c.stage, p.stage, hasPrev), psych: kpi(c.psych, p.psych, hasPrev),
    openFlags: kpi(c.openFlags, p.openFlags, hasPrev), pendingReview: kpi(c.pendingReview, p.pendingReview, hasPrev),
    callTypes: [...types].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    statuses: (["evaluated", "held", "processing", "failed"] as const).map((s) => ({ status: s, count: rows.filter((r) => r.call.status === s).length })),
    histogram: hist, salespeople: summarisePeople(rows, people),
    trends: { daily: trendSeries(all, range, "daily"), weekly: trendSeries(all, range, "weekly"), monthly: trendSeries(all, range, "monthly") },
    recent: evaluatedRows(rows).sort((a, b) => b.ts - a.ts).slice(0, 8),
    provisionalShare: ev.length ? ev.filter((r) => r.provisional).length / ev.length : null,
  };
}

export interface MissedCriterion { id: string; name: string; categoryId: string; missed: number; of: number }
/** Criteria scoring 0–1 across evaluated calls ("n of N calls"). */
export function missedCriteria(rows: Row[]): MissedCriterion[] {
  const ev = evaluatedRows(rows);
  return ALL_CRITERIA.map((k) => {
    const cs = ev.map((r) => r.doc!.sales_stage.find((c) => c.id === k.id)!).filter((c) => isNumeric(c.outcome));
    return { id: k.id, name: k.name, categoryId: k.categoryId, missed: cs.filter((c) => (c.outcome as number) <= 1).length, of: cs.length };
  }).filter((m) => m.missed > 0).sort((a, b) => b.missed / b.of - a.missed / a.of || b.missed - a.missed);
}

export function categoryAverages(rows: Row[]) {
  const ev = evaluatedRows(rows);
  return CATEGORIES.map((c) => {
    const ps = ev.map((r) => r.doc!.scores.categories.find((x) => x.id === c.id)!.pct).filter((p): p is number => p !== null);
    return { id: c.id, avg: avg(ps), n: ps.length };
  });
}

export function flagFrequency(rows: Row[]) {
  const fl = evaluatedRows(rows).flatMap((r) => r.doc!.extras.flags);
  return FLAGS.map((f) => ({ id: f.id as FlagId, count: fl.filter((x) => x.flagId === f.id && x.decision !== "dismissed").length, confirmed: fl.filter((x) => x.flagId === f.id && x.decision === "confirmed").length })).sort((a, b) => b.count - a.count);
}

export function objectionStats(rows: Row[]) {
  const os = evaluatedRows(rows).flatMap((r) => r.doc!.extras.objections);
  const types = [...new Set(os.map((o) => o.type))] as ObjectionType[];
  return types.map((t) => ({ type: t, total: os.filter((o) => o.type === t).length, handled_well: os.filter((o) => o.type === t && o.outcome === "handled_well").length, partially: os.filter((o) => o.type === t && o.outcome === "partially").length, poorly: os.filter((o) => o.type === t && o.outcome === "poorly").length, unclear: os.filter((o) => o.type === t && o.outcome === "unclear").length })).sort((a, b) => b.total - a.total);
}

export function reasonRates(rows: Row[]) {
  const cs = evaluatedRows(rows).flatMap((r) => r.doc!.sales_stage);
  const count = (o: "NA" | "NE") => { const m = new Map<ReasonCode, number>(); cs.filter((c) => c.outcome === o).forEach((c) => m.set(c.reasonCode!, (m.get(c.reasonCode!) ?? 0) + 1)); return [...m].map(([code, n]) => ({ code, n })).sort((a, b) => b.n - a.n); };
  return { total: cs.length, na: count("NA"), ne: count("NE") };
}

export function gateOutcomes(rows: Row[]) {
  const m = new Map<string, number>();
  rows.filter((r) => r.call.status !== "processing" && r.call.status !== "failed").forEach((r) => { const d = r.call.gates.transcript.decision; m.set(d, (m.get(d) ?? 0) + 1); });
  return [...m].map(([decision, n]) => ({ decision, n }));
}

/** Aggregates the top recurring coaching priorities across calls. */
export function topCoaching(rows: Row[], limit = 3) {
  const m = new Map<string, { n: number; action: string }>();
  evaluatedRows(rows).forEach((r) => r.doc!.extras.coaching_priorities.forEach((c) => { const e = m.get(c.categoryId) ?? { n: 0, action: c.action }; e.n++; m.set(c.categoryId, e); }));
  return [...m].map(([categoryId, v]) => ({ categoryId, calls: v.n, action: v.action })).sort((a, b) => b.calls - a.calls).slice(0, limit);
}

export function recurringFlags(rows: Row[]) { return flagFrequency(rows).filter((f) => f.count > 0); }

export function neRate(rows: Row[]) {
  const cs = evaluatedRows(rows).flatMap((r) => r.doc!.sales_stage);
  return cs.length ? cs.filter((c) => c.outcome === "NE").length / cs.length : null;
}

/** Weekly trend + trend claim only when enough evaluated calls. */
export function trendClaim(rows: Row[], range: DateRangeValue): number | null {
  const cur = evaluatedRows(inRangeRows(rows, range)), prev = evaluatedRows(inRangeRows(rows, previousRange(range)));
  if (range.preset === "all" || cur.length < MIN_SAMPLE || prev.length < MIN_SAMPLE) return null;
  const a = stageAvg(cur), b = stageAvg(prev);
  return a !== null && b !== null ? a - b : null;
}
