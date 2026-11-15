"use client";
import Link from "next/link";
import { Avatar, Badge, FlagCount, InfoTip, ScoreBar } from "@/components/ui/Badges";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { Segmented } from "@/components/ui/Form";
import { DonutChart, Histogram, ScoreTrendChart } from "@/components/charts/Charts";
import { CALL_TYPE_LABEL, MIN_SAMPLE } from "@/config/mrv1";
import { usePersistentState } from "@/hooks/usePersistentState";
import type { Overview, SalespersonSummary } from "@/lib/metrics";
import type { CallType, Granularity } from "@/types";

const TYPE_COLORS = ["#1d4ed8", "#0f8b8d", "#6d5bd0", "#d58a0b", "#64748b", "#c0407a", "#94a3b8"];
const STATUS_COLORS: Record<string, string> = { evaluated: "#1d4ed8", held: "#d58a0b", processing: "#94a3b8", failed: "#c83232" };
const X: Record<Granularity, string> = { daily: "Day", weekly: "Week starting (Mon)", monthly: "Month" };

export function ScoreTrendCard({ trends }: { trends: Overview["trends"] }) {
  const [g, setG] = usePersistentState<Granularity>("ffci2:trend-g", "weekly");
  const data = trends[g];
  return (
    <Card>
      <CardHeader title="Score trend" description="Two separate scores — never combined. Averages of evaluated calls; most are provisional."
        actions={<Segmented ariaLabel="Trend granularity" size="sm" value={g} onChange={setG} options={[{ id: "daily", label: "Daily" }, { id: "weekly", label: "Weekly" }, { id: "monthly", label: "Monthly" }]} />} />
      <CardBody>
        {data.some((d) => d.stage !== null) ? <ScoreTrendChart data={data} xLabel={X[g]} /> : <EmptyState title="No evaluated calls in this range" description="Choose a wider date range." />}
      </CardBody>
    </Card>
  );
}

export function MixCards({ o }: { o: Overview }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
      <Card><CardHeader title="Call type mix" description="Human-confirmed call types" />
        <CardBody>{o.callTypes.length ? <DonutChart centerLabel="calls" data={o.callTypes.map((t, i) => ({ label: CALL_TYPE_LABEL[t.type as CallType], value: t.count, color: TYPE_COLORS[i % TYPE_COLORS.length] }))} /> : <EmptyState title="No calls in this range" />}</CardBody></Card>
      <Card><CardHeader title="Evaluation status" />
        <CardBody>{o.statuses.some((s) => s.count) ? <DonutChart centerLabel="calls" data={o.statuses.map((s) => ({ label: s.status[0].toUpperCase() + s.status.slice(1), value: s.count, color: STATUS_COLORS[s.status] }))} /> : <EmptyState title="No calls in this range" />}</CardBody></Card>
    </div>
  );
}

export function HistogramCard({ o }: { o: Overview }) {
  const total = o.histogram.reduce((a, b) => a + b.count, 0);
  return (
    <Card className="h-full"><CardHeader title="Sales-stage score distribution" description="Evaluated calls in 10-point buckets" actions={<InfoTip text="Plain distribution — no good/poor labels, because score bands are not approved." />} />
      <CardBody>{total ? <Histogram data={o.histogram} /> : <EmptyState title="No evaluated calls in this range" />}</CardBody></Card>
  );
}

export function SalespersonOverview({ people }: { people: SalespersonSummary[] }) {
  const rows = people.filter((p) => p.calls > 0);
  return (
    <Card className="h-full">
      <CardHeader title="Salesperson overview" description="Not a ranking. Compare people only when sample sizes are comparable." actions={<InfoTip text={`People with fewer than ${MIN_SAMPLE} evaluated calls are marked "Low sample". Averages are provisional where any criterion was Not Evaluable.`} />} />
      {rows.length === 0 ? <EmptyState title="No calls in this range" /> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-[13px]">
          <thead className="border-y border-line bg-subtle/60 text-left text-xs font-medium text-ink-muted"><tr><th className="px-4 py-2">Salesperson</th><th className="px-3 py-2 text-right">Calls evaluated</th><th className="px-3 py-2">Avg sales-stage %</th><th className="px-3 py-2">Avg psychology %</th><th className="px-3 py-2">Flags</th></tr></thead>
          <tbody className="divide-y divide-line">{rows.map((p) => (
            <tr key={p.salesperson.id} className="hover:bg-subtle/50">
              <td className="px-4 py-2.5"><Link href={`/team/${p.salesperson.id}`} className="flex items-center gap-2.5 font-medium hover:text-brand"><Avatar name={p.salesperson.name} color={p.salesperson.avatar} size={26} />{p.salesperson.name}</Link></td>
              <td className="tabular px-3 py-2.5 text-right">{p.evaluated}{p.lowSample && <Badge tone="warn" className="ml-2">Low sample</Badge>}</td>
              <td className="px-3 py-2.5"><ScoreBar pct={p.stage} provisional /></td>
              <td className="px-3 py-2.5"><ScoreBar pct={p.psych} provisional /></td>
              <td className="px-3 py-2.5"><FlagCount count={p.flags} severity={p.topSeverity} /></td>
            </tr>))}</tbody></table></div>
      )}
    </Card>
  );
}
