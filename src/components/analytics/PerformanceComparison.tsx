"use client";
import { useMemo, useState } from "react";
import { GroupedBarChart, MultiLineChart } from "@/components/charts/ComparisonCharts";
import { Badge } from "@/components/ui/Badges";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Segmented, Select } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/States";
import { DIMENSIONS, MIN_SAMPLE_SIZE } from "@/config/rubric";
import { formatRange, previousRange, resolvePreset } from "@/lib/dates";
import { avg, dimensionScore, inRangeRows, trendSeries } from "@/lib/metrics";
import type { CallRow, DateRangeValue, DimensionId, Salesperson } from "@/types";

type Mode = "people" | "periods" | "categories";

const PERIODS: Record<string, { label: string; range: DateRangeValue }> = {
  last_7: { label: "Last 7 days", range: resolvePreset("last_7") },
  prev_7: { label: "Previous 7 days", range: previousRange(resolvePreset("last_7")) },
  last_30: { label: "Last 30 days", range: resolvePreset("last_30") },
  prev_30: { label: "Previous 30 days", range: previousRange(resolvePreset("last_30")) },
  this_month: { label: "This month", range: resolvePreset("this_month") },
  prev_month: { label: "Previous month", range: resolvePreset("prev_month") },
};

const dimAvg = (rows: CallRow[], dim: DimensionId) => {
  const v = avg(rows.filter((r) => r.evaluation).map((r) => dimensionScore(r.evaluation, dim)!));
  return v === null ? null : Math.round(v * 10) / 10;
};
const evaluatedCount = (rows: CallRow[]) => rows.filter((r) => r.evaluation).length;

export function PerformanceComparison({ rows, salespeople, range }: { rows: CallRow[]; salespeople: Salesperson[]; range: DateRangeValue }) {
  const [mode, setMode] = useState<Mode>("people");
  const [people, setPeople] = useState<string[]>(() => salespeople.slice(0, 2).map((s) => s.id));
  const [a, setA] = useState("last_30");
  const [b, setB] = useState("prev_30");
  const [dims, setDims] = useState<DimensionId[]>(["discovery", "objection", "closing"]);
  const [scope, setScope] = useState("team");

  const view = useMemo(() => {
    if (mode === "people") {
      const sel = salespeople.filter((s) => people.includes(s.id));
      const series = sel.map((s) => { const r = inRangeRows(rows, range).filter((x) => x.salesperson.id === s.id); return { key: s.id, name: `${s.name} (n=${evaluatedCount(r)})`, rows: r }; });
      return { kind: "bar" as const, series, data: DIMENSIONS.map((d) => ({ label: d.label, ...Object.fromEntries(series.map((s) => [s.key, dimAvg(s.rows, d.id)])) })), caption: `Range: ${formatRange(range)}` };
    }
    if (mode === "periods") {
      const sel = [a, b].map((k) => ({ key: k === a && a === b ? `${k}_2` : k, name: PERIODS[k].label, rows: inRangeRows(rows, PERIODS[k].range), id: k }));
      const series = sel.map((s) => ({ ...s, name: `${s.name} (n=${evaluatedCount(s.rows)})` }));
      return { kind: "bar" as const, series, data: DIMENSIONS.map((d) => ({ label: d.label, ...Object.fromEntries(series.map((s) => [s.key, dimAvg(s.rows, d.id)])) })), caption: `${PERIODS[a].label}: ${formatRange(PERIODS[a].range)} · ${PERIODS[b].label}: ${formatRange(PERIODS[b].range)}` };
    }
    const scoped = scope === "team" ? rows : rows.filter((r) => r.salesperson.id === scope);
    const sel = DIMENSIONS.filter((d) => dims.includes(d.id));
    const weeks = trendSeries(scoped, range, "weekly");
    const perDim = sel.map((d) => {
      const sub = scoped.map((r) => ({ ...r, overall: r.evaluation ? dimensionScore(r.evaluation, d.id) : null })) as CallRow[];
      return { d, pts: trendSeries(sub, range, "weekly") };
    });
    const n = evaluatedCount(inRangeRows(scoped, range));
    return {
      kind: "line" as const,
      series: sel.map((d) => ({ key: d.id, name: d.label })),
      data: weeks.map((w, i) => ({ label: w.label, ...Object.fromEntries(perDim.map((p) => [p.d.id, p.pts[i]?.avg ?? null])) })),
      caption: `${scope === "team" ? "Whole team" : salespeople.find((s) => s.id === scope)?.name} · ${n} evaluated calls · ${formatRange(range)}`,
      n,
    };
  }, [mode, people, a, b, dims, scope, rows, salespeople, range]);

  const toggle = <T extends string>(list: T[], v: T, set: (l: T[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const lowSampleNote = mode === "people" && view.kind === "bar" && "series" in view && view.series.some((s) => "rows" in s && evaluatedCount(s.rows as CallRow[]) < MIN_SAMPLE_SIZE);
  const empty = view.kind === "bar" ? view.series.length === 0 || view.series.every((s) => evaluatedCount((s as { rows: CallRow[] }).rows) === 0) : ("n" in view && view.n === 0) || view.series.length === 0;

  return (
    <Card>
      <CardHeader title="Performance comparison" description="Compare salespeople, time periods or evaluation categories using the same dataset"
        actions={<Segmented ariaLabel="Comparison mode" value={mode} onChange={setMode} options={[{ id: "people", label: "Salespeople" }, { id: "periods", label: "Time periods" }, { id: "categories", label: "Categories" }]} />} />
      <CardBody>
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-subtle/70 px-3 py-2.5">
          {mode === "people" && (<>
            <span className="text-xs font-medium text-ink-muted">Compare</span>
            {salespeople.map((s) => <Checkbox key={s.id} checked={people.includes(s.id)} onChange={() => toggle(people, s.id, setPeople)} label={s.name} />)}
          </>)}
          {mode === "periods" && (<>
            <label className="flex items-center gap-2 text-xs font-medium text-ink-muted">Period A<Select aria-label="Period A" value={a} onChange={(e) => setA(e.target.value)} className="w-[170px]">{Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></label>
            <label className="flex items-center gap-2 text-xs font-medium text-ink-muted">Period B<Select aria-label="Period B" value={b} onChange={(e) => setB(e.target.value)} className="w-[170px]">{Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></label>
          </>)}
          {mode === "categories" && (<>
            <label className="flex items-center gap-2 text-xs font-medium text-ink-muted">Scope<Select aria-label="Scope" value={scope} onChange={(e) => setScope(e.target.value)} className="w-[170px]"><option value="team">Whole team</option>{salespeople.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></label>
            {DIMENSIONS.map((d) => <Checkbox key={d.id} checked={dims.includes(d.id)} onChange={() => toggle(dims, d.id, setDims)} label={d.label} />)}
          </>)}
        </div>
        {empty ? <EmptyState title="Nothing to compare" description={mode === "categories" ? "Select at least one category with evaluated calls in range." : mode === "people" ? "Select at least one salesperson with evaluated calls in the selected date range." : "No evaluated calls in the chosen periods."} />
          : view.kind === "bar" ? <GroupedBarChart data={view.data} series={view.series.map((s) => ({ key: s.key, name: s.name }))} /> : <MultiLineChart data={view.data} series={view.series} />}
        <p className="mt-2 text-xs text-ink-muted">{view.caption}. Scores are 0–100 averages of evaluated calls only; sample size (n) is shown in the legend.</p>
        {lowSampleNote && <p className="mt-2"><Badge tone="warn">Low sample</Badge><span className="ml-2 text-xs text-ink-muted">At least one selected salesperson has fewer than {MIN_SAMPLE_SIZE} evaluated calls in this range — compare with caution.</span></p>}
      </CardBody>
    </Card>
  );
}
