"use client";
import { useMemo, useState } from "react";
import { ReviewQueueTable } from "@/components/reviews/ReviewQueue";
import { Card, PageHeader } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Form";
import { QueryGate, Skeleton } from "@/components/ui/States";
import { useDataset } from "@/hooks/useDataset";
import { buildReviewQueue } from "@/lib/reviews";
import type { ReviewReason } from "@/types";

type Tab = "all" | ReviewReason;
const TABS: { id: Tab; label: string; empty: string }[] = [
  { id: "all", label: "All", empty: "Review queue is clear" },
  { id: "requires_review", label: "Requires review", empty: "No calls awaiting review" },
  { id: "low_confidence", label: "Low confidence", empty: "No low-confidence cases" },
  { id: "uncertain_speaker", label: "Uncertain speaker", empty: "No uncertain speaker attribution" },
  { id: "failed", label: "Failed evaluations", empty: "No failed evaluations" },
  { id: "incomplete", label: "Incomplete processing", empty: "Nothing is still processing" },
  { id: "disputed", label: "Disputed", empty: "No disputed evaluations" },
];

export default function ReviewsPage() {
  const { rows, loading, error, reload, data } = useDataset();
  const [tab, setTab] = useState<Tab>("all");
  const queue = useMemo(() => buildReviewQueue(rows), [rows]);
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, t.id === "all" ? queue.length : queue.filter((q) => q.reasons.includes(t.id as ReviewReason)).length])) as Record<Tab, number>, [queue]);
  const items = tab === "all" ? queue : queue.filter((q) => q.reasons.includes(tab));
  return (
    <>
      <PageHeader title="Review Centre" description="Evaluations that need a manager's attention — open a call to approve, dispute, correct a score or add notes. Approved calls leave the review-driven queues." />
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<Skeleton className="h-[420px]" />}>
        <Card>
          <div className="border-b border-line p-3"><Segmented ariaLabel="Review categories" value={tab} onChange={setTab} options={TABS.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] }))} /></div>
          <ReviewQueueTable items={items} emptyTitle={TABS.find((t) => t.id === tab)!.empty} />
        </Card>
        <p className="mt-3 text-xs text-ink-muted">A call can appear in several categories at once. Priority: high = failed, disputed, or low-confidence awaiting review; medium = needs review or attribution/confidence concerns; low = still processing.</p>
      </QueryGate>
    </>
  );
}
