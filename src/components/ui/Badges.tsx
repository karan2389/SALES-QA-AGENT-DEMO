import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVAL_LABEL, OUTCOME_BY_ID, REVIEW_LABEL, bandFor } from "@/config/ui";
import type { EvaluationStatus, Outcome, ReviewStatus } from "@/types";
import { Tooltip } from "./Tooltip";

type Tone = "neutral" | "good" | "warn" | "bad" | "brand";
const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-soft border-line",
  good: "bg-good-soft text-good border-good/20",
  warn: "bg-warn-soft text-warn border-warn/25",
  bad: "bg-bad-soft text-bad border-bad/20",
  brand: "bg-brand-soft text-brand border-brand/20",
};

export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Outcome uses its own neutral palette (never green/red) so it can't be mistaken for quality. */
export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const o = OUTCOME_BY_ID[outcome];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-0.5 text-xs font-medium text-ink-soft">
      <span className="h-2 w-2 rounded-[3px]" style={{ background: o.color }} />
      {o.label}
    </span>
  );
}

const evalTone: Record<EvaluationStatus, Tone> = { completed: "good", processing: "brand", failed: "bad", needs_review: "warn" };
export const EvalStatusBadge = ({ status }: { status: EvaluationStatus }) => <Badge tone={evalTone[status]} dot>{EVAL_LABEL[status]}</Badge>;

const reviewTone: Record<ReviewStatus, Tone> = { not_reviewed: "neutral", pending_review: "warn", approved: "good", disputed: "bad" };
export const ReviewStatusBadge = ({ status }: { status: ReviewStatus }) => <Badge tone={reviewTone[status]}>{REVIEW_LABEL[status]}</Badge>;

/** Numeric score with its band colour. */
export function ScoreValue({ score, className }: { score: number | null; className?: string }) {
  if (score === null) return <span className="text-ink-muted">—</span>;
  const band = bandFor(score);
  return (
    <span className={cn("inline-flex items-center gap-1.5 tabular font-semibold text-ink", className)}>
      <span className="h-2 w-2 rounded-full" style={{ background: band.color }} aria-hidden />
      {Math.round(score)}
      <span className="sr-only"> ({band.label})</span>
    </span>
  );
}

export function InfoTip({ text }: { text: ReactNode }) {
  return (
    <Tooltip content={text}>
      <span tabIndex={0} className="inline-flex cursor-help text-ink-muted hover:text-ink" aria-label="More information"><Info className="h-3.5 w-3.5" /></span>
    </Tooltip>
  );
}

const avatarColors: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700", teal: "bg-teal-100 text-teal-700", amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700", rose: "bg-rose-100 text-rose-700", slate: "bg-slate-200 text-slate-700",
};
export function Avatar({ name, color = "slate", size = 28 }: { name: string; color?: string; size?: number }) {
  const init = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", avatarColors[color] ?? avatarColors.slate)}
      style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>{init}</span>
  );
}
