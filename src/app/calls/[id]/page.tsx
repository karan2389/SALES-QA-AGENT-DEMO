"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, SearchX } from "lucide-react";
import { CallHeader } from "@/components/calls/detail/CallHeader";
import { EvaluationBreakdown } from "@/components/calls/detail/EvaluationBreakdown";
import { ImprovementsCard, StrengthsCard } from "@/components/calls/detail/EvidenceCards";
import { OutcomeVsQuality } from "@/components/calls/detail/OutcomeVsQuality";
import { ReviewPanel } from "@/components/calls/detail/ReviewPanel";
import { ScoreCard } from "@/components/calls/detail/ScoreCard";
import { TranscriptViewer, type TranscriptHandle } from "@/components/calls/detail/TranscriptViewer";
import { Card } from "@/components/ui/Card";
import { EmptyState, QueryGate, Skeleton } from "@/components/ui/States";
import { useAsync } from "@/hooks/useAsync";
import { getCallById } from "@/services";
import type { CategoryId } from "@/types";

const DetailSkeleton = () => (
  <div className="space-y-4"><Skeleton className="h-[150px]" />
    <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-[280px]" /><Skeleton className="h-[280px] lg:col-span-2" /></div>
    <Skeleton className="h-[420px]" /></div>
);

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync(() => getCallById(id), [id]);
  const transcript = useRef<TranscriptHandle>(null);
  const [category, setCategory] = useState<CategoryId | null>(null);

  return (
    <>
      <Link href="/calls" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />Back to Call Explorer</Link>
      <QueryGate loading={loading} error={error} hasData={data !== undefined} onRetry={reload} skeleton={<DetailSkeleton />}>
        {data === null ? (
          <Card><EmptyState icon={<SearchX className="h-5 w-5" />} title="Call not found" description={`No call with ID “${id}” exists in the mock dataset.`} action={<Link href="/calls" className="text-[13px] font-medium text-brand hover:underline">Open Call Explorer</Link>} /></Card>
        ) : data && (
          <div className="space-y-4">
            <CallHeader detail={data} />
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2"><ScoreCard detail={data} /></div>
              <div className="lg:col-span-3"><OutcomeVsQuality detail={data} /></div>
            </div>
            <div className="grid items-start gap-4 xl:grid-cols-3">
              <div className="space-y-4 xl:col-span-2">
                {data.evaluation && <EvaluationBreakdown evaluation={data.evaluation} activeCategory={category} onSelect={setCategory} />}
                <TranscriptViewer ref={transcript} transcript={data.transcript} evidence={data.evidence} highlightCategory={category} onClearHighlight={() => setCategory(null)} />
              </div>
              <div className="xl:sticky xl:top-20"><ReviewPanel detail={data} /></div>
            </div>
            {data.evaluation && (
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <StrengthsCard evaluation={data.evaluation} evidence={data.evidence} onJump={(sid) => transcript.current?.jumpTo(sid)} />
                <ImprovementsCard evaluation={data.evaluation} evidence={data.evidence} onJump={(sid) => transcript.current?.jumpTo(sid)} />
              </div>
            )}
          </div>
        )}
      </QueryGate>
    </>
  );
}
