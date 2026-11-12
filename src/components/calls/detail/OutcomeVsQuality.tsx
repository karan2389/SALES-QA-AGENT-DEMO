import { InfoTip, OutcomeBadge } from "@/components/ui/Badges";
import { Card, CardHeader } from "@/components/ui/Card";
import { SCORE_BANDS, bandFor } from "@/config/ui";
import { cn } from "@/lib/utils";
import type { CallDetail } from "@/types";

const THRESHOLD = SCORE_BANDS[1].min; // "Good" band start

const CELLS = [
  { converted: true, strong: false, title: "Converted despite selling gaps", note: "Result may not be repeatable" },
  { converted: true, strong: true, title: "Converted with strong selling", note: "Model example" },
  { converted: false, strong: false, title: "Not converted, selling gaps", note: "Coaching opportunity" },
  { converted: false, strong: true, title: "Not converted, strong selling", note: "Outcome driven by other factors" },
];

export function OutcomeVsQuality({ detail }: { detail: CallDetail }) {
  const { call, evaluation } = detail;
  const score = evaluation?.overallScore ?? null;
  const strong = score !== null ? score >= THRESHOLD : null;
  const converted = call.outcome === "converted";
  const pending = call.outcome === "pending";

  let reading = "Quality can't be assessed until the evaluation completes. Outcome is recorded separately.";
  if (score !== null) {
    if (pending) reading = "Outcome is still pending. Quality is assessed on the conversation itself, independent of how the deal ends.";
    else if (converted && !strong) reading = "This call converted, but the evaluation found selling gaps. A win is not proof of high-quality selling — coach the gaps before they cost a future deal.";
    else if (converted) reading = "Converted and well sold — a good candidate to share as a coaching example.";
    else if (!strong) reading = "Not converted, and the evaluation found selling gaps worth coaching.";
    else reading = "Not converted, yet the call was well sold. Don't penalise the salesperson for an outcome driven by prospect circumstances.";
  }

  return (
    <Card className="h-full">
      <CardHeader title="Outcome vs. quality" description="Two separate dimensions — one does not imply the other"
        actions={<InfoTip text={`The matrix splits quality at ${THRESHOLD} (start of the provisional “Good” band). Follow-up and unsuccessful calls are shown as “not converted”.`} />} />
      <div className="px-4 pb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line p-3"><p className="text-xs text-ink-muted">Call outcome (business result)</p><div className="mt-1.5"><OutcomeBadge outcome={call.outcome} /></div></div>
          <div className="rounded-lg border border-line p-3"><p className="text-xs text-ink-muted">Selling quality (evaluation)</p>
            <p className="mt-1.5 flex items-center gap-2 text-[13px] font-semibold">{score === null ? <span className="text-ink-muted">Not available</span> : <><span className="h-2.5 w-2.5 rounded-full" style={{ background: bandFor(score).color }} /><span className="tabular">{score}</span><span className="font-normal text-ink-muted">{bandFor(score).label}</span></>}</p></div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2" aria-label="Outcome versus quality matrix">
          {CELLS.map((c) => {
            const active = !pending && strong !== null && c.converted === converted && c.strong === strong;
            return (
              <div key={c.title} className={cn("rounded-lg border p-2.5 text-xs transition-colors", active ? "border-brand bg-brand-soft" : "border-line bg-subtle/50 text-ink-muted")} aria-current={active}>
                <p className={cn("font-medium", active ? "text-brand" : "text-ink-soft")}>{c.title}</p>
                <p className="mt-0.5 text-2xs">{c.note}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 rounded-md bg-subtle px-3 py-2 text-[13px] text-ink-soft">{reading}</p>
      </div>
    </Card>
  );
}
