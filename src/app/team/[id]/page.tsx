"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, SearchX } from "lucide-react";
import { OutcomeDonut } from "@/components/charts/OutcomeDonut";
import { QualityTrendChart } from "@/components/charts/QualityTrendChart";
import { CategoryStrengthCard, CoachingCard, MissedItemsCard, ObjectionGapsCard, RecentCallsCard } from "@/components/team/ProfileSections";
import { Avatar, Badge } from "@/components/ui/Badges";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, QueryGate, Skeleton } from "@/components/ui/States";
import { TrendDelta } from "@/components/ui/TrendDelta";
import { MIN_SAMPLE_SIZE } from "@/config/rubric";
import { useAsync } from "@/hooks/useAsync";
import { useDateRange } from "@/hooks/useDateRange";
import { formatDate, formatRange, rangeDays } from "@/lib/dates";
import { getSalespersonProfile } from "@/services";

export default function SalespersonPage() {
  const { id } = useParams<{ id: string }>();
  const { range } = useDateRange();
  const { data, loading, error, reload } = useAsync(() => getSalespersonProfile(id, range), [id, range.preset, range.from, range.to]);
  return (
    <>
      <Link href="/team" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />Back to Sales Team</Link>
      <QueryGate loading={loading} error={error} hasData={data !== undefined} onRetry={reload} skeleton={<Skeleton className="h-[500px]" />}>
        {data === null ? (
          <Card><EmptyState icon={<SearchX className="h-5 w-5" />} title="Salesperson not found" action={<Link href="/team" className="text-[13px] font-medium text-brand hover:underline">Open Sales Team</Link>} /></Card>
        ) : data && (
          <div className="space-y-4">
            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar name={data.salesperson.name} color={data.salesperson.avatar} size={52} />
                  <div><h1 className="text-xl font-semibold">{data.salesperson.name}</h1>
                    <p className="text-[13px] text-ink-muted">{data.salesperson.role} · {data.salesperson.team}</p>
                    <p className="text-xs text-ink-muted">Joined {formatDate(data.salesperson.joinedOn)} · {data.salesperson.email} (mock)</p></div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-ink-muted"><Badge tone="warn">Illustrative mock data</Badge><span>Date range: {formatRange(range)} (change in top bar)</span></div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
                <div><dt className="text-xs text-ink-muted">Calls in range</dt><dd className="tabular mt-0.5 text-xl font-semibold">{data.totalCalls}</dd></div>
                <div><dt className="text-xs text-ink-muted">Calls evaluated</dt><dd className="tabular mt-0.5 text-xl font-semibold">{data.evaluated}{data.lowSample && <Badge tone="warn" className="ml-2 align-middle">Low sample</Badge>}</dd></div>
                <div><dt className="text-xs text-ink-muted">Average quality score</dt><dd className="mt-0.5 flex items-baseline gap-2"><span className="tabular text-xl font-semibold">{data.avgScore === null ? "—" : Math.round(data.avgScore)}</span><span className="text-xs text-ink-muted">n={data.evaluated}</span></dd></div>
                <div><dt className="text-xs text-ink-muted">Improvement trend</dt><dd className="mt-1"><TrendDelta value={data.trend} unit=" pts" className="text-base" /><span className="ml-1.5 text-xs text-ink-muted">vs previous range</span></dd></div>
              </dl>
              {data.lowSample && <p className="mt-3 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">Fewer than {MIN_SAMPLE_SIZE} evaluated calls in this range — averages and trends are indicative only and shouldn&apos;t be used to rank this person.</p>}
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="h-full"><CardHeader title="Quality trend" description={`Average score per ${rangeDays(range) <= 14 ? "day" : "week"} · evaluated calls only`} />
                  <CardBody>{data.trendSeries.some((p) => p.avg !== null)
                    ? <QualityTrendChart data={data.trendSeries} xLabel={rangeDays(range) <= 14 ? "Day" : "Week starting (Mon)"} height={230} name={data.salesperson.name.split(" ")[0]} />
                    : <EmptyState title="No evaluated calls in this range" />}</CardBody></Card>
              </div>
              <Card className="h-full"><CardHeader title="Conversion outcomes" description="Call outcomes — separate from quality" />
                <CardBody>{data.totalCalls ? <OutcomeDonut data={data.outcomes} /> : <EmptyState title="No calls in this range" />}</CardBody></Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <CategoryStrengthCard profile={data} which="strongest" />
              <CategoryStrengthCard profile={data} which="weakest" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2"><MissedItemsCard profile={data} /><ObjectionGapsCard profile={data} /></div>
            <CoachingCard profile={data} />
            <RecentCallsCard profile={data} />
          </div>
        )}
      </QueryGate>
    </>
  );
}
