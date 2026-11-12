"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScoreBar } from "@/components/charts/ScoreIndicators";
import { EvalStatusBadge, OutcomeBadge, ReviewStatusBadge } from "@/components/ui/Badges";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { formatDate, formatDuration, formatTime } from "@/lib/dates";
import type { CallRow } from "@/types";

export function RecentEvaluations({ rows }: { rows: CallRow[] }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader title="Recent call evaluations" description="Latest evaluated calls in the selected range — click a row to open the report"
        actions={<Link href="/calls" className="text-[13px] font-medium text-brand hover:underline">View all calls</Link>} />
      {rows.length === 0 ? <EmptyState title="No evaluated calls in this range" /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead className="border-y border-line bg-subtle/60 text-left text-xs font-medium text-ink-muted">
              <tr>{["Salesperson", "Prospect", "Call date", "Duration", "Outcome", "Quality score", "Evaluation", "Review"].map((h) => <th key={h} scope="col" className="px-4 py-2">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.call.id} onClick={() => router.push(`/calls/${r.call.id}`)} className="cursor-pointer hover:bg-subtle/60">
                  <td className="px-4 py-2.5 font-medium text-ink">{r.salesperson.name}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/calls/${r.call.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-brand hover:underline">{r.call.prospectName}</Link>
                    <span className="ml-2 text-xs text-ink-muted">{r.call.id}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{formatDate(r.call.callDate)} <span className="text-ink-muted">{formatTime(r.call.callDate)}</span></td>
                  <td className="tabular whitespace-nowrap px-4 py-2.5 text-ink-soft">{formatDuration(r.call.durationSeconds)}</td>
                  <td className="px-4 py-2.5"><OutcomeBadge outcome={r.call.outcome} /></td>
                  <td className="px-4 py-2.5"><ScoreBar score={r.overall} /></td>
                  <td className="px-4 py-2.5"><EvalStatusBadge status={r.call.evaluationStatus} /></td>
                  <td className="px-4 py-2.5"><ReviewStatusBadge status={r.call.reviewStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
