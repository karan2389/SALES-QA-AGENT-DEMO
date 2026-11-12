"use client";
import { useMemo } from "react";
import { TeamTable } from "@/components/team/TeamTable";
import { Badge } from "@/components/ui/Badges";
import { Card, PageHeader } from "@/components/ui/Card";
import { EmptyState, QueryGate, Skeleton } from "@/components/ui/States";
import { MIN_SAMPLE_SIZE } from "@/config/rubric";
import { useDataset } from "@/hooks/useDataset";
import { useDateRange } from "@/hooks/useDateRange";
import { formatRange } from "@/lib/dates";
import { inRangeRows, teamTable } from "@/lib/metrics";

export default function TeamPage() {
  const { rows, salespeople, loading, error, reload, data } = useDataset();
  const { range } = useDateRange();
  const table = useMemo(() => teamTable(rows, salespeople, range), [rows, salespeople, range]);
  const anyCalls = inRangeRows(rows, range).length > 0;
  return (
    <>
      <PageHeader title="Sales Team" description={<>Performance overview per salesperson · {formatRange(range)}. Open a profile for strengths, gaps and coaching.</>} actions={<Badge tone="warn">Illustrative mock data</Badge>} />
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<Skeleton className="h-[420px]" />}>
        <Card>
          {!anyCalls ? <EmptyState title="No calls in this date range" description="Pick a wider range from the date selector in the top bar." /> : <TeamTable rows={table} />}
        </Card>
        <p className="mt-3 text-xs text-ink-muted">Each average is shown with the number of evaluated calls it is based on (n). Salespeople with fewer than {MIN_SAMPLE_SIZE} evaluated calls are marked “Low sample”, sorted after the rest and should not be compared directly. Converted calls are a business result and are not a quality measure. Improvement trend compares this range with the previous equal-length range and needs at least 2 evaluated calls in each.</p>
      </QueryGate>
    </>
  );
}
