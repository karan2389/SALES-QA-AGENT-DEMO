"use client";
import { useMemo } from "react";
import { HorizontalBars } from "@/components/charts/HorizontalBars";
import { Badge, InfoTip } from "@/components/ui/Badges";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { EmptyState, QueryGate, Skeleton } from "@/components/ui/States";
import { ALL_CRITERIA, CATEGORIES, FLAGS, GATE, OBJECTION_LABEL, REASON_LABEL, STAGE_GROUPS } from "@/config/mrv1";
import { scoreColor, scoreInk } from "@/config/ui";
import { useDataset } from "@/hooks/useDataset";
import { useDateRange } from "@/hooks/useDateRange";
import { formatRange } from "@/lib/dates";
import { avg, evaluatedRows, flagFrequency, gateOutcomes, inRangeRows, missedCriteria, objectionStats, reasonRates } from "@/lib/metrics";

const GROUP_ORDER = ["1-6", "7-12", "13-19"];

export default function AnalyticsPage() {
  const { rows, salespeople, loading, error, reload, data } = useDataset();
  const { range } = useDateRange();
  const inR = useMemo(() => inRangeRows(rows, range), [rows, range]);
  const ev = useMemo(() => evaluatedRows(inR), [inR]);
  const people = useMemo(() => salespeople.filter((s) => ev.some((r) => r.salesperson.id === s.id)), [salespeople, ev]);
  const cell = (catId: string, spId: string) => { const ps = ev.filter((r) => r.salesperson.id === spId).map((r) => r.doc!.scores.categories.find((c) => c.id === catId)!.pct).filter((p): p is number => p !== null); return { v: avg(ps), n: ps.length }; };
  const missed = useMemo(() => missedCriteria(inR).slice(0, 10), [inR]);
  const flags = useMemo(() => flagFrequency(inR), [inR]);
  const objections = useMemo(() => objectionStats(inR), [inR]);
  const reasons = useMemo(() => reasonRates(inR), [inR]);
  const gates = useMemo(() => gateOutcomes(inR), [inR]);
  const groups = useMemo(() => GROUP_ORDER.map((g) => ({ id: g, avg: avg(ev.map((r) => r.doc!.scores.groups.find((x) => x.id === g)!.pct).filter((p): p is number => p !== null)), n: ev.length })), [ev]);
  const maxFlag = Math.max(1, ...flags.map((f) => f.count));
  const maxGate = Math.max(1, ...gates.map((g) => g.n));
  const maxObj = Math.max(1, ...objections.map((o) => o.total));
  return (
    <>
      <PageHeader title="Team Analytics" description={<>Where the team is strong, what it keeps missing and what prospects push back on · {formatRange(range)}</>} actions={<Badge tone="warn">Illustrative mock data</Badge>} />
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<Skeleton className="h-[600px]" />}>
        {ev.length === 0 ? <Card><EmptyState title="No evaluated calls in this range" description="Choose a wider range in the top bar." /></Card> : (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Category heatmap" description="Average category % (C01–C19) by salesperson. Darker blue = higher; blue is neutral, not a judgement." actions={<InfoTip text="Each cell shows the average and the number of calls in which the category was scorable. Cells with fewer than 3 calls are outlined." />} />
              <div className="overflow-x-auto px-4 pb-4"><table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs">
                <thead><tr><th className="text-left font-medium text-ink-muted">Category</th>{people.map((p) => <th key={p.id} className="px-1 text-center font-medium text-ink-soft">{p.name.split(" ")[0]}</th>)}</tr></thead>
                <tbody>{CATEGORIES.map((c) => (
                  <tr key={c.id}><th scope="row" className="whitespace-nowrap pr-3 text-left font-normal text-ink-soft"><span className="tabular mr-1.5 text-ink-muted">{c.id}</span>{c.name}</th>
                    {people.map((p) => { const x = cell(c.id, p.id); return <td key={p.id} className="tabular rounded text-center font-semibold" style={x.v === null ? { background: "#f1f5f9", color: "#64748b" } : { background: scoreColor(x.v), color: scoreInk(x.v), outline: x.n < 3 ? "1.5px dashed #64748b" : undefined, outlineOffset: -2 }} title={x.v === null ? "No scorable calls" : `${x.v.toFixed(1)}% across ${x.n} call${x.n === 1 ? "" : "s"}`}><div className="px-1 py-1.5">{x.v === null ? "—" : x.v.toFixed(0)}<span className="ml-1 text-[10px] font-normal opacity-80">n{x.n}</span></div></td>; })}</tr>))}</tbody></table></div>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="h-full"><CardHeader title="Stage-group averages" description="The three evaluation passes" />
                <CardBody><HorizontalBars labelWidth={170} rows={groups.map((g) => ({ id: g.id, label: STAGE_GROUPS.find((x) => x.id === g.id)!.label, value: g.avg ?? 0, display: g.avg === null ? "—" : `${g.avg.toFixed(1)}%`, sub: `n=${g.n}`, color: scoreColor(Math.max(35, g.avg ?? 0)) }))} /><p className="mt-3 text-2xs text-ink-muted">Averages of provisional category scores across {ev.length} evaluated calls.</p></CardBody></Card>
              <Card className="h-full"><CardHeader title="Most-missed criteria" description="Scored 0–1 — “n of N calls”" />
                <CardBody><ul className="space-y-2">{missed.map((m) => <li key={m.id} className="flex items-center justify-between gap-3 text-[13px]"><span className="min-w-0 truncate"><span className="tabular mr-1.5 text-xs text-ink-muted">{m.id}</span>{ALL_CRITERIA.find((c) => c.id === m.id)!.name}</span><span className="tabular shrink-0 font-semibold">{m.missed} of {m.of}<span className="ml-1 font-normal text-ink-muted">({Math.round((m.missed / m.of) * 100)}%)</span></span></li>)}</ul></CardBody></Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="h-full"><CardHeader title="Flag frequency" description="By flag ID, excluding flags a human dismissed" />
                <CardBody><HorizontalBars labelWidth={200} max={maxFlag} rows={flags.map((f) => ({ id: f.id, label: FLAGS.find((x) => x.id === f.id)!.label, value: f.count, display: String(f.count), sub: f.confirmed ? `${f.confirmed} conf.` : undefined, color: "#c83232" }))} /></CardBody></Card>
              <Card className="h-full"><CardHeader title="Objection analysis" description="By objection type and how it was handled" />
                <CardBody>{objections.length === 0 ? <EmptyState title="No objections recorded" /> : (<><ul className="space-y-3">{objections.map((o) => (
                  <li key={o.type} className="grid grid-cols-[130px_1fr_30px] items-center gap-3 sm:grid-cols-[170px_1fr_30px]"><span className="truncate text-[13px] text-ink-soft">{OBJECTION_LABEL[o.type]}</span>
                    <span className="flex h-2.5 overflow-hidden rounded-full bg-subtle" style={{ width: `${(o.total / maxObj) * 100}%`, minWidth: 6 }} title={`${o.handled_well} well · ${o.partially} partial · ${o.poorly} poor · ${o.unclear} unclear`}>{([["handled_well", "#1d4ed8"], ["partially", "#7aa2f0"], ["poorly", "#d58a0b"], ["unclear", "#94a3b8"]] as const).map(([k, c]) => o[k] > 0 && <span key={k} style={{ width: `${(o[k] / o.total) * 100}%`, background: c }} />)}</span><span className="tabular text-right text-[13px] font-semibold">{o.total}</span></li>))}</ul>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">{[["Handled well", "#1d4ed8"], ["Partially", "#7aa2f0"], ["Poorly", "#d58a0b"], ["Unclear", "#94a3b8"]].map(([l, c]) => <li key={l}><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: c }} />{l}</li>)}</ul></>)}</CardBody></Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="h-full"><CardHeader title="N/A and NE rates by reason code" description={`Share of ${reasons.total} sales-stage criterion evaluations`} />
                <CardBody>{[["Not evaluable (NE)", reasons.ne], ["Not applicable (N/A)", reasons.na]].map(([title, list]) => (
                  <div key={title as string} className="mb-3"><h3 className="mb-1.5 text-xs font-semibold text-ink-muted">{title as string}: {(list as typeof reasons.ne).reduce((a, b) => a + b.n, 0)} ({((list as typeof reasons.ne).reduce((a, b) => a + b.n, 0) / reasons.total * 100).toFixed(1)}%)</h3>
                    {(list as typeof reasons.ne).length === 0 ? <p className="text-[13px] text-ink-muted">None.</p> : <ul className="space-y-1">{(list as typeof reasons.ne).map((r) => <li key={r.code} className="flex justify-between text-[13px]"><span><code className="text-2xs text-ink-muted">{r.code}</code> {REASON_LABEL[r.code]}</span><span className="tabular font-semibold">{r.n} <span className="font-normal text-ink-muted">({(r.n / reasons.total * 100).toFixed(1)}%)</span></span></li>)}</ul>}</div>))}</CardBody></Card>
              <Card className="h-full"><CardHeader title="Transcript-gate outcomes" description="All calls that reached the gate (including held calls)" />
                <CardBody><HorizontalBars labelWidth={190} max={maxGate} rows={GATE.transcript.map((g) => ({ id: g.id, label: g.label, value: gates.find((x) => x.decision === g.id)?.n ?? 0, display: String(gates.find((x) => x.decision === g.id)?.n ?? 0), color: g.id === "eligible" ? "#1d4ed8" : "#d58a0b" }))} /></CardBody></Card>
            </div>
          </div>
        )}
      </QueryGate>
    </>
  );
}
