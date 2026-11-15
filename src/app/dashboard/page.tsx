"use client";
import Link from "next/link";
import { CallsTable } from "@/components/calls/CallsTable";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { HistogramCard, MixCards, SalespersonOverview, ScoreTrendCard } from "@/components/dashboard/Panels";
import { Badge } from "@/components/ui/Badges";
import { Card, CardHeader, PageHeader } from "@/components/ui/Card";
import { QueryGate, Skeleton } from "@/components/ui/States";
import { useTeamAnalytics } from "@/hooks/useTeamAnalytics";
import { formatRange } from "@/lib/dates";

const Skel = () => (
  <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[120px]" />)}</div>
    <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-[340px] lg:col-span-2" /><Skeleton className="h-[340px]" /></div></div>
);

export default function DashboardPage() {
  const { data, loading, error, reload, range } = useTeamAnalytics();
  return (
    <>
      <PageHeader title="Overview" description={<>MRV1.0 evaluations across the sales team · {formatRange(range)}</>} actions={<Badge tone="warn">Illustrative mock data</Badge>} />
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<Skel />}>
        {data && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <KpiCard label="Calls evaluated" kpi={data.evaluated} tooltip="Calls with a completed MRV1 evaluation in the selected range (every one still requires human review)." />
              <KpiCard label="Held / blocked calls" kpi={data.held} goodWhen="down" tooltip="Calls stopped before evaluation by a gate (recording, transcript or call type) or not scored by the rubric." />
              <KpiCard label="Avg sales-stage score" kpi={data.stage} format={(n) => `${n.toFixed(1)}%`} unit=" pts" digits={1} tooltip="Average of the applicable category percentages (C01–C19, counted equally). Provisional when any criterion was Not Evaluable." footnote={data.provisionalShare !== null ? `${Math.round(data.provisionalShare * 100)}% of calls provisional` : undefined} />
              <KpiCard label="Avg psychology score" kpi={data.psych} format={(n) => `${n.toFixed(1)}%`} unit=" pts" digits={1} tooltip="Separate Sales Psychology & Conduct scorecard (SP-01…SP-22). Never combined with the sales-stage score." />
              <KpiCard label="Open critical flags" kpi={data.openFlags} goodWhen="down" accent tooltip="Critical flags still waiting for a human decision (confirm or dismiss)." footnote={<Link href="/reviews" className="text-brand hover:underline">Open Human Review</Link>} />
              <KpiCard label="Pending human review" kpi={data.pendingReview} tooltip="Evaluations that no human has approved or disputed yet. Every evaluation starts here." />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2"><ScoreTrendCard trends={data.trends} /></div>
              <MixCards o={data} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <HistogramCard o={data} />
              <div className="lg:col-span-2"><SalespersonOverview people={data.salespeople} /></div>
            </div>
            <Card>
              <CardHeader title="Recent call evaluations" description="Latest evaluated calls — click a row to open the report" actions={<Link href="/calls" className="text-[13px] font-medium text-brand hover:underline">View all calls</Link>} />
              <CallsTable rows={data.recent} />
            </Card>
          </div>
        )}
      </QueryGate>
    </>
  );
}
