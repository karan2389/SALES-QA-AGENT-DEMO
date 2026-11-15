"use client";
import { useState } from "react";
import { ChevronRight, EyeOff, Gauge, Pencil, ShieldAlert } from "lucide-react";
import { Badge, OutcomeChip, Term } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { REASON_LABEL, TERMS } from "@/config/mrv1";
import { cn } from "@/lib/utils";
import type { CriterionEval } from "@/types";
import { useReport } from "./ctx";
import { CorrectionDialog } from "./CorrectionDialog";
import { QuoteBlock, mmss } from "./primitives";

export function CriterionRow({ c, defaultOpen }: { c: CriterionEval; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [correcting, setCorrecting] = useState(false);
  const { record } = useReport();
  const flagged = record.doc?.extras.flags.some((f) => f.capsCriteria.includes(c.id));
  const corrected = c.review.status === "corrected";
  return (
    <div className="cv-auto rounded-md border border-line bg-surface" id={`crit-${c.id}`}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 px-2.5 py-2 text-left hover:bg-subtle/60">
        <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform", open && "rotate-90")} />
        <span className="tabular w-[52px] shrink-0 text-xs font-semibold text-ink-muted">{c.id}</span>
        <span className="min-w-0 flex-1 text-[13px] text-ink">{c.name}</span>
        <span className="flex flex-wrap items-center gap-1.5">
          {corrected && <OutcomeChip outcome={c.modelOutcome} struck />}
          <OutcomeChip outcome={c.outcome} />
          {c.cap && <Term tip={TERMS.cap}><span className="inline-flex items-center gap-1 rounded-md bg-bad-soft px-1.5 py-0.5 text-xs font-semibold text-bad"><ShieldAlert className="h-3 w-3" />Capped</span></Term>}
          {flagged && !c.cap && <Badge tone="bad"><ShieldAlert className="h-3 w-3" />Flagged</Badge>}
          {c.evidenceConfidence && <Term tip={TERMS.confidence}><span className="inline-flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-2xs text-ink-soft"><Gauge className="h-3 w-3" />{c.evidenceConfidence} evidence</span></Term>}
          <Badge tone={corrected ? "brand" : "neutral"}>{corrected ? "Corrected by human" : "Pending review"}</Badge>
        </span>
      </button>
      {open && (
        <div className="space-y-2.5 border-t border-line px-3 py-3 text-[13px]">
          {c.quotes.map((q, i) => <QuoteBlock key={i} q={q} />)}
          {c.outcome === "NE" && <p className="flex items-center gap-1.5 rounded-md border border-dashed border-ink-muted/40 bg-subtle px-2.5 py-2 text-ink-soft"><EyeOff className="h-3.5 w-3.5" /><strong>No evidence.</strong> Reason: {REASON_LABEL[c.reasonCode!]}.</p>}
          {c.outcome === "NA" && <p className="rounded-md bg-subtle px-2.5 py-2 text-ink-soft">Not applicable — {REASON_LABEL[c.reasonCode!]}.</p>}
          {c.absence && <p className="rounded-md border border-line bg-subtle/60 px-2.5 py-2 text-ink-soft"><strong className="text-ink">Absence record</strong> {mmss(c.absence.start, c.absence.end)}: {c.absence.note}</p>}
          <p className="text-ink"><span className="font-medium">Explanation: </span>{c.explanation}</p>
          {typeof c.outcome === "number" && c.outcome <= 2 && c.improvement && <p className="rounded-md bg-brand-soft/60 px-2.5 py-2 text-ink"><span className="font-medium">Improvement: </span>{c.improvement}</p>}
          {c.cap && <p className="rounded-md bg-bad-soft px-2.5 py-2 text-bad"><strong>{c.id} capped at {c.modelOutcome} because of flag {c.cap.flagId}.</strong> Engine score before cap: {c.cap.originalScore}.</p>}
          {corrected && <p className="rounded-md bg-brand-soft px-2.5 py-2 text-brand">Human correction by {c.review.by}: engine outcome <s>{String(c.modelOutcome)}</s> → {String(c.outcome)}. Reason: {c.review.reason}</p>}
          <Button size="sm" variant="ghost" onClick={() => setCorrecting(true)}><Pencil className="h-3.5 w-3.5" />Correct outcome</Button>
        </div>
      )}
      <CorrectionDialog open={correcting} criterion={c} onClose={() => setCorrecting(false)} />
    </div>
  );
}
