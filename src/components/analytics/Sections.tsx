import { HorizontalBars } from "@/components/charts/HorizontalBars";
import { Badge, InfoTip } from "@/components/ui/Badges";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { TrendDelta } from "@/components/ui/TrendDelta";
import { CATEGORY_BY_ID, CHECKLIST_BY_ID, DIMENSION_BY_ID, OBJECTION_LABEL } from "@/config/rubric";
import { bandFor } from "@/config/ui";
import type { TeamAnalytics } from "@/types";

export function CategoryPerformanceCard({ data }: { data: TeamAnalytics }) {
  const n = data.dimensions[0]?.n ?? 0;
  return (
    <Card className="h-full">
      <CardHeader title="Category-level performance" description={`Team average per evaluation area · ${n} evaluated calls`} actions={<InfoTip text="Each area averages the rubric categories mapped to it in the central config. Change vs previous period compares equal-length ranges." />} />
      <CardBody>
        {n === 0 ? <EmptyState title="No evaluated calls in this range" /> : (
          <ul className="space-y-3">
            {data.dimensions.map((d) => (
              <li key={d.id} className="grid grid-cols-[130px_1fr_40px_64px] items-center gap-3 sm:grid-cols-[160px_1fr_40px_72px]">
                <span className="truncate text-[13px] text-ink-soft" title={DIMENSION_BY_ID[d.id].description}>{DIMENSION_BY_ID[d.id].label}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-subtle"><span className="block h-full rounded-full" style={{ width: `${d.avg ?? 0}%`, background: d.avg === null ? "#cbd5e1" : bandFor(d.avg).color }} /></span>
                <span className="tabular text-right text-[13px] font-semibold">{d.avg === null ? "—" : Math.round(d.avg)}</span>
                <span className="text-right"><TrendDelta value={d.avg !== null && d.previous !== null ? d.avg - d.previous : null} /></span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export function WeaknessesCard({ data }: { data: TeamAnalytics }) {
  return (
    <Card className="h-full">
      <CardHeader title="Common weaknesses" description="Recurring problems across the team, from missed checklist items" actions={<InfoTip text="A call is counted when at least half of the checklist items linked to the weakness were not covered." />} />
      <CardBody>
        {data.weaknesses[0]?.n === 0 ? <EmptyState title="No evaluated calls in this range" /> : (
          <HorizontalBars labelWidth={210} max={1} rows={data.weaknesses.map((w) => ({ id: w.id, label: w.label, value: w.rate, display: `${Math.round(w.rate * 100)}%`, sub: `${w.callsAffected}/${w.n}`, color: "#d58a0b" }))} />
        )}
      </CardBody>
    </Card>
  );
}

const HANDLING = [{ k: "well", label: "Handled well", color: "#16865a" }, { k: "partial", label: "Partially", color: "#d58a0b" }, { k: "poor", label: "Poorly", color: "#c83232" }] as const;

export function ObjectionCard({ data }: { data: TeamAnalytics }) {
  const total = data.objections.reduce((a, o) => a + o.count, 0);
  const max = Math.max(1, ...data.objections.map((o) => o.count));
  return (
    <Card className="h-full">
      <CardHeader title="Objection analysis" description={`${total} objections raised in evaluated calls, by how well they were handled`} />
      <CardBody>
        {total === 0 ? <EmptyState title="No objections recorded in this range" /> : (
          <>
            <ul className="space-y-3">
              {[...data.objections].sort((a, b) => b.count - a.count).map((o) => (
                <li key={o.category} className="grid grid-cols-[130px_1fr_70px] items-center gap-3 sm:grid-cols-[170px_1fr_80px]">
                  <span className="truncate text-[13px] text-ink-soft">{OBJECTION_LABEL[o.category]}</span>
                  <span className="flex h-2.5 overflow-hidden rounded-full bg-subtle" style={{ width: `${(o.count / max) * 100}%`, minWidth: o.count ? 6 : 0 }} title={`${o.well} well · ${o.partial} partial · ${o.poor} poor`}>
                    {HANDLING.map((h) => o[h.k] > 0 && <span key={h.k} style={{ width: `${(o[h.k] / o.count) * 100}%`, background: h.color }} />)}
                  </span>
                  <span className="tabular text-right text-[13px] font-semibold">{o.count}<span className="ml-1 font-normal text-ink-muted">{Math.round((o.count / total) * 100)}%</span></span>
                </li>
              ))}
            </ul>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">{HANDLING.map((h) => <li key={h.k}><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: h.color }} />{h.label}</li>)}</ul>
          </>
        )}
      </CardBody>
    </Card>
  );
}

export function AdherenceCard({ data }: { data: TeamAnalytics }) {
  const n = data.adherence[0]?.n ?? 0;
  const overall = n ? data.adherence.reduce((a, c) => a + c.rate, 0) / data.adherence.length : 0;
  return (
    <Card className="h-full">
      <CardHeader title="Sales process adherence" description="How consistently each step of the provisional sales process is followed" actions={n ? <Badge tone={overall >= 0.75 ? "good" : overall >= 0.6 ? "warn" : "bad"}>Overall {Math.round(overall * 100)}%</Badge> : undefined} />
      <CardBody>
        {n === 0 ? <EmptyState title="No evaluated calls in this range" /> : (
          <>
            <HorizontalBars labelWidth={200} max={1} rows={data.adherence.map((a) => ({ id: a.categoryId, label: CATEGORY_BY_ID[a.categoryId].label, value: a.rate, display: `${Math.round(a.rate * 100)}%`, color: a.rate >= 0.75 ? "#16865a" : a.rate >= 0.6 ? "#2563eb" : "#d58a0b" }))} />
            <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Most-missed checklist items</h3>
            <ul className="grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
              {data.missedItems.slice(0, 6).map((m) => <li key={m.itemId} className="flex items-center justify-between gap-2"><span className="truncate text-ink-soft">{CHECKLIST_BY_ID[m.itemId].label}</span><span className="tabular font-medium text-warn">{Math.round(m.missRate * 100)}%</span></li>)}
            </ul>
            <p className="mt-3 text-2xs text-ink-muted">Adherence = checklist items covered ÷ items in the step, across {n} evaluated calls. Checklist is provisional.</p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
