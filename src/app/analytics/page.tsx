"use client";
import { AdherenceCard, CategoryPerformanceCard, ObjectionCard, WeaknessesCard } from "@/components/analytics/Sections";
import { PerformanceComparison } from "@/components/analytics/PerformanceComparison";
import { QualityTrendCard } from "@/components/dashboard/QualityTrendCard";
import { Badge } from "@/components/ui/Badges";
import { PageHeader } from "@/components/ui/Card";
import { QueryGate, Skeleton } from "@/components/ui/States";
import { useDataset } from "@/hooks/useDataset";
import { useTeamAnalytics } from "@/hooks/useTeamAnalytics";
import { formatRange } from "@/lib/dates";

export default function AnalyticsPage() {
  const { data, loading, error, reload, range } = useTeamAnalytics();
  const ds = useDataset();
  return (
    <>
      <PageHeader title="Team Analytics" description={<>Where the team is strong, where it keeps missing, and what prospects push back on · {formatRange(range)}</>} actions={<Badge tone="warn">Illustrative mock data</Badge>} />
      <QueryGate loading={loading || ds.loading} error={error ?? ds.error} hasData={!!data && !!ds.data} onRetry={() => { reload(); ds.reload(); }}
        skeleton={<div className="space-y-4"><Skeleton className="h-[340px]" /><div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-[320px]" /><Skeleton className="h-[320px]" /></div></div>}>
        {data && ds.data && (
          <div className="space-y-4">
            <QualityTrendCard trends={data.trends} title="Quality trends" description="Team average overall quality score" />
            <div className="grid gap-4 lg:grid-cols-2"><CategoryPerformanceCard data={data} /><WeaknessesCard data={data} /></div>
            <div className="grid gap-4 lg:grid-cols-2"><ObjectionCard data={data} /><AdherenceCard data={data} /></div>
            <PerformanceComparison rows={ds.rows} salespeople={ds.salespeople} range={range} />
          </div>
        )}
      </QueryGate>
    </>
  );
}
