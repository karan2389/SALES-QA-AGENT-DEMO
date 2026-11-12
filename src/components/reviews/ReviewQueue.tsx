"use client";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Avatar, Badge, EvalStatusBadge, ReviewStatusBadge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { formatDate, formatTime } from "@/lib/dates";
import { REASON_LABEL } from "@/lib/reviews";
import type { ReviewQueueItem } from "@/types";

const PRIORITY_TONE = { high: "bad", medium: "warn", low: "neutral" } as const;

export function ReviewQueueTable({ items, emptyTitle }: { items: ReviewQueueItem[]; emptyTitle: string }) {
  if (items.length === 0) return <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title={emptyTitle} description="Nothing in this category needs attention right now." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-[13px]">
        <thead className="border-y border-line bg-subtle/60 text-left text-xs font-medium text-ink-muted">
          <tr>{["Call ID", "Salesperson", "Date", "Reason for review", "Current status", "Priority", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-2">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((i) => (
            <tr key={i.callId} className="hover:bg-subtle/50">
              <td className="px-4 py-3"><Link href={`/calls/${i.callId}`} className="font-medium text-brand hover:underline">{i.callId}</Link></td>
              <td className="px-4 py-3"><span className="flex items-center gap-2"><Avatar name={i.salesperson.name} color={i.salesperson.avatar} size={24} />{i.salesperson.name}</span></td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(i.callDate)} <span className="text-ink-muted">{formatTime(i.callDate)}</span></td>
              <td className="px-4 py-3"><ul className="flex flex-wrap gap-1">{i.reasons.map((r) => <li key={r}><Badge tone={r === "failed" || r === "disputed" ? "bad" : "warn"}>{REASON_LABEL[r]}</Badge></li>)}</ul></td>
              <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><EvalStatusBadge status={i.evaluationStatus} /><ReviewStatusBadge status={i.status} /></div></td>
              <td className="px-4 py-3"><Badge tone={PRIORITY_TONE[i.priority]} className="capitalize">{i.priority}</Badge></td>
              <td className="px-4 py-3 text-right"><Link href={`/calls/${i.callId}`}><Button size="sm" variant="primary">Open &amp; review</Button></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
