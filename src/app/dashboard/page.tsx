"use client";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OutcomeCard, QualityBandsCard } from "@/components/dashboard/DistributionCards";
import { Leaderboard } from "@/components/dashboard/Leaderboard";
import { QualityTrendCard } from "@/components/dashboard/QualityTrendCard";
import { RecentEvaluations } from "@/components/dashboard/RecentEvaluations";
import { Card, PageHeader } from "@/components/ui/Card";
import { QueryGate, Skeleton } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badges";
import { formatRange } from "@/lib/dates";
import { useTeamAnalytics } from "@/hooks/useTeamAnalytics";

const DashboardSkeleton = () => (
  <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[128px]" />)}</div>
    <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-[360px] lg:col-span-2" /><Skeleton className="h-[360px]" /></div>
    <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-[320px]" /><Skeleton className="h-[320px] lg:col-span-2" /></div>
  </div>
);

export default function DashboardPage() {
  const { data, loading, error, reload, range } = useTeamAnalytics();
  return (
    <>
      <PageHeader title="Overview" description={<>Call quality across the sales team · {formatRange(range)}</>}
        actions={<Badge tone="warn">Illustrative mock data</Badge>} />
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<DashboardSkeleton />}>
        {data && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard label="Total calls evaluated" kpi={data.kpis.evaluated} format={(n) => String(Math.round(n))} deltaDigits={0}
                tooltip="Calls in the selected range that have a completed evaluation (including those flagged for review)." />
              <KpiCard label="Average call quality" kpi={data.kpis.avgScore} format={(n) => n.toFixed(1)} deltaUnit=" pts"
                tooltip="Mean overall score (0–100) of evaluated calls. Overall score is a weighted blend of the provisional rubric categories." />
              <KpiCard label="Conversion rate" kpi={data.kpis.conversion} format={(n) => `${n.toFixed(1)}%`} deltaUnit=" pts"
                tooltip="Converted calls ÷ calls with a decided outcome (pending excluded). This is a business result, not a quality measure." />
              <KpiCard label="Calls needing manager review" kpi={data.kpis.needsReview} format={(n) => String(Math.round(n))} deltaDigits={0} goodWhen="down"
                tooltip="Calls marked pending review or flagged 'needs review' by the evaluation pipeline. Lower is better." />
              <KpiCard label="Processing success rate" kpi={data.kpis.processing} format={(n) => `${n.toFixed(1)}%`} deltaUnit=" pts"
                tooltip="Share of calls that finished processing without a failure (calls still processing are excluded)." />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2"><QualityTrendCard trends={data.trends} /></div>
              <OutcomeCard data={data.outcomes} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <QualityBandsCard bands={data.bands} />
              <div className="lg:col-span-2"><Leaderboard entries={data.leaderboard} /></div>
            </div>
            <RecentEvaluations rows={data.recent} />
            <Card className="border-dashed bg-transparent p-3 text-xs text-ink-muted shadow-none">
              Prototype notice: every figure on this page is computed from a centralized, illustrative mock dataset. Nothing here represents actual FlexiFunnels sales performance. Score bands and rubric weights are provisional.
            </Card>
          </div>
        )}
      </QueryGate>
    </>
  );
}
