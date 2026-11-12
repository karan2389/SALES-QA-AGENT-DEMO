"use client";
import { QualityTrendChart } from "@/components/charts/QualityTrendChart";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/States";
import { usePersistentState } from "@/hooks/usePersistentState";
import type { Granularity, TrendPoint } from "@/types";

const X_LABEL: Record<Granularity, string> = { daily: "Day", weekly: "Week starting (Mon)", monthly: "Month" };

export function QualityTrendCard({ trends, title = "Call quality trend", description = "Average overall quality score of evaluated calls" }: {
  trends: Record<Granularity, TrendPoint[]>; title?: string; description?: string;
}) {
  const [g, setG] = usePersistentState<Granularity>("ffci:trend-granularity", "weekly");
  const data = trends[g];
  const has = data.some((d) => d.avg !== null);
  return (
    <Card>
      <CardHeader title={title} description={description}
        actions={<Segmented ariaLabel="Trend granularity" size="sm" value={g} onChange={setG}
          options={[{ id: "daily", label: "Daily" }, { id: "weekly", label: "Weekly" }, { id: "monthly", label: "Monthly" }]} />} />
      <CardBody>
        {has ? <QualityTrendChart data={data} xLabel={X_LABEL[g]} /> : <EmptyState title="No evaluated calls in this range" description="Choose a wider date range to see the trend." />}
        <p className="mt-1 text-2xs text-ink-muted">Dashed lines mark the provisional Good (70) and Excellent (85) band thresholds. Buckets without evaluated calls are skipped.</p>
      </CardBody>
    </Card>
  );
}
