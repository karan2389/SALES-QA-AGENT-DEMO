import type { ReactNode } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, CircleSlash, EyeOff, Info, MinusCircle, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { TERMS } from "@/config/mrv1";
import { EVAL_STATUS_LABEL, GATE_LABEL, REVIEW_LABEL, scoreColor, scoreInk } from "@/config/ui";
import { cn } from "@/lib/utils";
import type { EvalStatus, GateStatus, HumanReviewStatus, Outcome, Severity, Speaker } from "@/types";
import { Tooltip } from "./Tooltip";

export type Tone = "neutral" | "good" | "warn" | "bad" | "brand";
const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-soft border-line", good: "bg-good-soft text-good border-good/20", warn: "bg-warn-soft text-warn border-warn/25",
  bad: "bg-bad-soft text-bad border-bad/20", brand: "bg-brand-soft text-brand border-brand/20",
};

export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}{children}
    </span>
  );
}

export function InfoTip({ text }: { text: ReactNode }) {
  return <Tooltip content={text}><span tabIndex={0} className="inline-flex cursor-help text-ink-muted hover:text-ink" aria-label="More information"><Info className="h-3.5 w-3.5" /></span></Tooltip>;
}

/** Wraps a term with a dotted underline and a plain-language tooltip. */
export function Term({ children, tip }: { children: ReactNode; tip: ReactNode }) {
  return <Tooltip content={tip}><span tabIndex={0} className="cursor-help underline decoration-dotted decoration-ink-muted/60 underline-offset-2">{children}</span></Tooltip>;
}

export function ProvisionalPill({ className }: { className?: string }) {
  return <Tooltip content={TERMS.provisional}><span tabIndex={0} className={cn("inline-flex cursor-help items-center gap-1 rounded-full border border-warn/30 bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn", className)}><AlertTriangle className="h-3 w-3" />Provisional</span></Tooltip>;
}

/** "58.6% (provisional)" — provisional unless no criterion was Not Evaluable. */
export function ScorePct({ pct, provisional, className, digits = 1 }: { pct: number | null; provisional?: boolean; className?: string; digits?: number }) {
  if (pct === null) return <span className="text-ink-muted">—</span>;
  return (
    <span className={cn("tabular font-semibold text-ink", className)}>
      {pct.toFixed(digits)}%{provisional && <Tooltip content={TERMS.provisional}><span className="ml-1 cursor-help text-xs font-medium text-warn">(provisional)</span></Tooltip>}
    </span>
  );
}

export function ScoreBar({ pct, provisional, width = "w-14" }: { pct: number | null; provisional?: boolean; width?: string }) {
  if (pct === null) return <span className="text-ink-muted">—</span>;
  return (
    <div className="flex items-center gap-2">
      <span className="tabular w-[46px] text-right text-[13px] font-semibold text-ink">{pct.toFixed(1)}%</span>
      <div className={cn("h-1.5 overflow-hidden rounded-full bg-line", width)}><div className="h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, background: scoreColor(Math.max(35, pct)) }} /></div>
      {provisional && <Tooltip content={TERMS.provisional}><span className="h-1.5 w-1.5 cursor-help rounded-full bg-warn" aria-label="Provisional" /></Tooltip>}
    </div>
  );
}

/** Criterion outcome chip. Meaning is conveyed by icon + text, not colour alone. */
export function OutcomeChip({ outcome, struck }: { outcome: Outcome; struck?: boolean }) {
  if (outcome === "NE") return <Tooltip content={TERMS.ne}><span tabIndex={0} className={cn("inline-flex cursor-help items-center gap-1 rounded-md border border-dashed border-ink-muted/50 bg-subtle px-1.5 py-0.5 text-xs font-semibold text-ink-soft", struck && "line-through opacity-60")}><EyeOff className="h-3 w-3" />NE</span></Tooltip>;
  if (outcome === "NA") return <Tooltip content={TERMS.na}><span tabIndex={0} className={cn("inline-flex cursor-help items-center gap-1 rounded-md border border-line bg-white px-1.5 py-0.5 text-xs font-semibold text-ink-muted", struck && "line-through opacity-60")}><MinusCircle className="h-3 w-3" />N/A</span></Tooltip>;
  const pct = (outcome / 3) * 100;
  return <span className={cn("tabular inline-flex min-w-[26px] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold", struck && "line-through opacity-60")} style={{ background: scoreColor(Math.max(8, pct)), color: scoreInk(Math.max(8, pct)) }} title={["Not demonstrated", "Weakly demonstrated", "Mostly demonstrated", "Fully demonstrated"][outcome]}>{outcome}</span>;
}

const SEV: Record<Severity, { tone: Tone; icon: typeof AlertOctagon }> = { critical: { tone: "bad", icon: AlertOctagon }, high: { tone: "bad", icon: ShieldAlert }, medium: { tone: "warn", icon: AlertTriangle }, low: { tone: "warn", icon: AlertTriangle } };
export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEV[severity];
  return <Badge tone={s.tone} className="capitalize"><s.icon className="h-3 w-3" />{severity}</Badge>;
}
/** Red flag count with highest severity; always visible, independent of scores. */
export function FlagCount({ count, severity }: { count: number; severity: Severity | null }) {
  if (!count) return <span className="text-xs text-ink-muted">No flags</span>;
  return <Tooltip content={`${count} critical flag${count > 1 ? "s" : ""}. Highest severity: ${severity}.`}><span tabIndex={0}><Badge tone="bad"><AlertOctagon className="h-3 w-3" />{count} · <span className="capitalize">{severity}</span></Badge></span></Tooltip>;
}

const GATE_ICON = { pass: ShieldCheck, review: ShieldQuestion, blocked: CircleSlash };
const GATE_TONE: Record<GateStatus, Tone> = { pass: "good", review: "warn", blocked: "bad" };
export function GateBadge({ status }: { status: GateStatus }) {
  const I = GATE_ICON[status];
  return <Tooltip content={TERMS.gate}><span tabIndex={0}><Badge tone={GATE_TONE[status]}><I className="h-3 w-3" />{GATE_LABEL[status]}</Badge></span></Tooltip>;
}

const EVAL_TONE: Record<EvalStatus, Tone> = { evaluated: "brand", held: "warn", processing: "neutral", failed: "bad" };
export const EvalStatusBadge = ({ status }: { status: EvalStatus }) => <Badge tone={EVAL_TONE[status]} dot>{EVAL_STATUS_LABEL[status]}</Badge>;

export function ReviewChip({ status }: { status: HumanReviewStatus | null }) {
  if (!status) return <span className="text-xs text-ink-muted">—</span>;
  const tone: Tone = status === "approved" ? "good" : status === "disputed" ? "bad" : "neutral";
  return <Badge tone={tone}>{status === "approved" && <CheckCircle2 className="h-3 w-3" />}{REVIEW_LABEL[status]}</Badge>;
}

const SPK: Record<Speaker, { label: string; cls: string }> = {
  salesperson: { label: "Salesperson", cls: "bg-brand-soft text-brand" }, prospect: { label: "Prospect", cls: "bg-subtle text-ink-soft" },
  unclear: { label: "Uncertain speaker", cls: "bg-warn-soft text-warn" },
};
export function SpeakerBadge({ speaker }: { speaker: Speaker }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-2xs font-semibold", SPK[speaker].cls)}>{speaker === "unclear" && <AlertTriangle className="h-3 w-3" />}{SPK[speaker].label}</span>;
}

const avatarColors: Record<string, string> = { blue: "bg-blue-100 text-blue-700", teal: "bg-teal-100 text-teal-700", amber: "bg-amber-100 text-amber-700", violet: "bg-violet-100 text-violet-700", rose: "bg-rose-100 text-rose-700", slate: "bg-slate-200 text-slate-700" };
export function Avatar({ name, color = "slate", size = 28 }: { name: string; color?: string; size?: number }) {
  const init = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", avatarColors[color] ?? avatarColors.slate)} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>{init}</span>;
}
