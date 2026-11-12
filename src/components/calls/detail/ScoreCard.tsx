import { AlertTriangle, Hourglass } from "lucide-react";
import { ScoreRing } from "@/components/charts/ScoreIndicators";
import { Badge, InfoTip } from "@/components/ui/Badges";
import { Card, CardHeader } from "@/components/ui/Card";
import { bandFor } from "@/config/ui";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CallDetail, ConfidenceLabel } from "@/types";

const confTone: Record<ConfidenceLabel, "good" | "warn" | "bad"> = { high: "good", medium: "warn", low: "bad" };

function Gauge({ label, value, tip }: { label: string; value: number; tip: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-muted"><span className="flex items-center gap-1">{label}<InfoTip text={tip} /></span><span className="tabular font-medium text-ink">{Math.round(value * 100)}%</span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink-muted/60" style={{ width: `${value * 100}%` }} /></div>
    </div>
  );
}

export function ScoreCard({ detail }: { detail: CallDetail }) {
  const { evaluation: ev, call } = detail;
  if (!ev) {
    const failed = call.evaluationStatus === "failed";
    return (
      <Card className="h-full">
        <CardHeader title="Overall quality score" />
        <div className="px-4 pb-5 text-center">
          <div className={cn("mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full", failed ? "bg-bad-soft text-bad" : "bg-brand-soft text-brand")}>{failed ? <AlertTriangle className="h-6 w-6" /> : <Hourglass className="h-6 w-6" />}</div>
          <p className="text-sm font-medium text-ink">{failed ? "Evaluation failed" : "Evaluation in progress"}</p>
          <p className="mt-1 text-[13px] text-ink-muted">{failed
            ? detail.transcript?.transcriptionStatus === "failed" ? "Transcription failed, so no score was generated. Flag the call for review to have it re-processed." : "The transcript is available but the evaluation step failed. No score was generated."
            : "This call is still being transcribed and evaluated. A score will appear when processing completes."}</p>
        </div>
      </Card>
    );
  }
  const band = bandFor(ev.overallScore);
  const adjusted = ev.overallScore !== ev.originalOverallScore;
  return (
    <Card className="h-full">
      <CardHeader title="Overall quality score" description="Weighted blend of provisional rubric categories" />
      <div className="px-4 pb-4">
        <div className="flex items-center gap-5">
          <ScoreRing score={ev.overallScore} />
          <div className="min-w-0 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: band.color + "55", background: band.color + "14", color: band.color }}>{band.label}</span>
            <p className="text-xs text-ink-muted">Band {band.min}–{band.max} (provisional)</p>
            {adjusted && <p className="text-xs text-brand">Adjusted by manager: model score was <span className="tabular font-semibold">{ev.originalOverallScore}</span></p>}
          </div>
        </div>
        <div className="mt-4 space-y-3 border-t border-line pt-3.5">
          <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1 text-ink-muted">Evaluation confidence<InfoTip text="How sure the model is about its own evaluation (transcript quality, speaker clarity). It says nothing about how well the salesperson sold." /></span><Badge tone={confTone[ev.confidenceLevel]}>{ev.confidenceLevel} · {Math.round(ev.confidence * 100)}%</Badge></div>
          <Gauge label="Evidence coverage" value={ev.evidenceCoverage} tip="Share of rubric checklist items for which supporting transcript evidence was found. Low coverage means a less certain score, not a worse call." />
          <p className="text-2xs text-ink-muted">Confidence and coverage describe the evaluation, not the call. Rubric {ev.rubricVersion} · {ev.skillVersion} · evaluated {formatDateTime(ev.evaluatedAt)}.</p>
        </div>
      </div>
    </Card>
  );
}
