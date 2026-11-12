import { ArrowRightCircle, CheckCircle2, Lightbulb, Quote, TriangleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { CATEGORY_BY_ID } from "@/config/rubric";
import { formatClock } from "@/lib/dates";
import type { Evaluation, Evidence } from "@/types";

function Excerpt({ ev, onJump }: { ev: Evidence; onJump: (segmentId: string) => void }) {
  return (
    <figure className="mt-2 rounded-md border border-line bg-subtle/60 p-2.5">
      <blockquote className="flex gap-2 text-[13px] italic leading-relaxed text-ink-soft"><Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />{ev.excerpt}</blockquote>
      <figcaption className="mt-1.5 text-xs">
        <button onClick={() => onJump(ev.segmentId)} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
          <ArrowRightCircle className="h-3.5 w-3.5" />Jump to {formatClock(ev.timestamp)} in transcript
        </button>
      </figcaption>
    </figure>
  );
}

export function StrengthsCard({ evaluation, evidence, onJump }: { evaluation: Evaluation; evidence: Evidence[]; onJump: (id: string) => void }) {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  return (
    <Card>
      <CardHeader title="Strengths" description="What the salesperson did well, with supporting evidence" />
      {evaluation.strengths.length === 0 ? <EmptyState title="No category reached the strength threshold" description="Scores in this call were all below 70, so no strength is highlighted." /> : (
        <ul className="space-y-3 px-4 pb-4">
          {evaluation.strengths.map((s) => {
            const ev = byId.get(s.evidenceId);
            return (
              <li key={s.evidenceId} className="rounded-lg border border-good/25 bg-good-soft/30 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-good"><CheckCircle2 className="h-3.5 w-3.5" />{CATEGORY_BY_ID[s.category].label}<span className="ml-auto tabular font-medium text-ink-muted">{ev ? formatClock(ev.timestamp) : ""}</span></p>
                <p className="mt-1 text-[13px] text-ink">{s.observation}</p>
                {ev && <Excerpt ev={ev} onJump={onJump} />}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function ImprovementsCard({ evaluation, evidence, onJump }: { evaluation: Evaluation; evidence: Evidence[]; onJump: (id: string) => void }) {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  return (
    <Card>
      <CardHeader title="Improvement areas" description="What was missed, why it matters and how to coach it" />
      {evaluation.improvementAreas.length === 0 ? <EmptyState title="No significant gaps found" description="Every category scored 70 or above in this evaluation." /> : (
        <ul className="space-y-3 px-4 pb-4">
          {evaluation.improvementAreas.map((i) => {
            const ev = byId.get(i.evidenceId);
            return (
              <li key={i.evidenceId} className="rounded-lg border border-warn/25 bg-warn-soft/30 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-warn"><TriangleAlert className="h-3.5 w-3.5" />{CATEGORY_BY_ID[i.category].label}<span className="ml-auto tabular font-medium text-ink-muted">{ev ? formatClock(ev.timestamp) : ""}</span></p>
                <dl className="mt-2 grid gap-2 text-[13px] sm:grid-cols-3">
                  <div><dt className="text-xs font-medium text-ink-muted">What was missed</dt><dd className="mt-0.5 text-ink">{i.missed}</dd></div>
                  <div><dt className="text-xs font-medium text-ink-muted">Why it matters</dt><dd className="mt-0.5 text-ink">{i.whyItMatters}</dd></div>
                  <div><dt className="text-xs font-medium text-ink-muted">What to do instead</dt><dd className="mt-0.5 text-ink">{i.shouldHaveDone}</dd></div>
                </dl>
                {ev && <Excerpt ev={ev} onJump={onJump} />}
                <p className="mt-2 flex items-start gap-1.5 rounded-md bg-surface px-2.5 py-2 text-[13px] text-ink-soft"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /><span><span className="font-medium text-ink">Recommended coaching: </span>{i.coachingAction}</span></p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
