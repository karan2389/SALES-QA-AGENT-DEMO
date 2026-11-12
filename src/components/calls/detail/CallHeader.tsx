import Link from "next/link";
import { Mic, MicOff } from "lucide-react";
import { Avatar, EvalStatusBadge, OutcomeBadge, ReviewStatusBadge } from "@/components/ui/Badges";
import { Card } from "@/components/ui/Card";
import { LANGUAGE_LABEL } from "@/config/ui";
import { formatDateTime, formatDuration } from "@/lib/dates";
import type { CallDetail } from "@/types";

const Meta = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0"><dt className="text-xs text-ink-muted">{label}</dt><dd className="mt-0.5 truncate text-[13px] font-medium text-ink">{children}</dd></div>
);

export function CallHeader({ detail }: { detail: CallDetail }) {
  const { call, salesperson } = detail;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="tabular text-xs font-medium text-ink-muted">{call.id} <span className="mx-1">·</span> Callyzer {call.callyzerCallId}</p>
          <h1 className="mt-1 text-xl font-semibold text-ink">{call.prospectName}</h1>
          <p className="text-[13px] text-ink-muted">{call.phoneNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OutcomeBadge outcome={call.outcome} />
          <EvalStatusBadge status={call.evaluationStatus} />
          <ReviewStatusBadge status={call.reviewStatus} />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 sm:grid-cols-3 lg:grid-cols-5">
        <Meta label="Salesperson">
          <Link href={`/team/${salesperson.id}`} className="inline-flex items-center gap-1.5 hover:text-brand"><Avatar name={salesperson.name} color={salesperson.avatar} size={20} />{salesperson.name}</Link>
        </Meta>
        <Meta label="Call date & time">{formatDateTime(call.callDate)}</Meta>
        <Meta label="Duration"><span className="tabular">{formatDuration(call.durationSeconds)}</span></Meta>
        <Meta label="Language">{LANGUAGE_LABEL[call.language]}</Meta>
        <Meta label="Recording (playback not in prototype)">
          {call.recordingAvailable ? <span className="inline-flex items-center gap-1.5 text-good"><Mic className="h-3.5 w-3.5" />Available</span>
            : <span className="inline-flex items-center gap-1.5 text-bad"><MicOff className="h-3.5 w-3.5" />Unavailable</span>}
        </Meta>
      </dl>
    </Card>
  );
}
