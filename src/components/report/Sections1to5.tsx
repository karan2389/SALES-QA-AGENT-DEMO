"use client";
import { useState } from "react";
import { AlertOctagon, ChevronDown, EyeOff, MinusCircle } from "lucide-react";
import { Badge, InfoTip, ProvisionalPill, ScorePct, Term } from "@/components/ui/Badges";
import { CALL_TYPE_LABEL, CATEGORIES, FLAG_BY_ID, REASON_LABEL, TERMS } from "@/config/mrv1";
import { GATE_LABEL, scoreColor } from "@/config/ui";
import { formatDateTime, formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Mrv1Document } from "@/types";
import { useReport } from "./ctx";
import { Field, JumpButton, Section, hatch } from "./primitives";
import { CriterionRow } from "./CriterionRow";

export function S1CallDetails({ heldOnly }: { heldOnly?: boolean }) {
  const { record, salesperson } = useReport();
  const { call, doc } = record;
  const g = call.gates;
  return (
    <Section id="s1" n={1} title="Call Details" desc="Identifiers use the Callyzer call ID only. Phone numbers are masked.">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        <Field label="Callyzer call ID">{call.id}</Field>
        <Field label="Call type">{CALL_TYPE_LABEL[call.callType]}<span className="block text-xs font-normal text-ink-muted">{call.callTypeConfirmedBy ? `confirmed by ${call.callTypeConfirmedBy}` : "Held — call type needs confirmation"}</span></Field>
        <Field label="Salesperson">{salesperson.name}</Field>
        <Field label="Date & time">{formatDateTime(call.callDate)}</Field>
        <Field label="Recording length"><span className="tabular">{g.recording.audioSec} s of {g.recording.loggedSec} s</span><span className="block text-xs font-normal text-ink-muted">{formatDuration(call.durationSec)} logged · {Math.round((g.recording.audioSec / g.recording.loggedSec) * 100)}% recorded</span></Field>
        <Field label="Masked phone">{call.phoneMasked}</Field>
        <Field label="Transcript source & language">{record.transcript ? `${record.transcript.source} · ${call.language === "hindi" ? "Hindi" : "English"}` : "No transcript"}</Field>
        <Field label={<Term tip={TERMS.coverage}>Transcript coverage</Term>}>{(g.transcript.coverage * 100).toFixed(0)}% <span className="text-xs font-normal text-ink-muted">(coverage, not accuracy)</span></Field>
        <Field label="Rubric version">{doc?.metadata.rubricVersion ?? "MRV1.0"}</Field>
        <Field label="Evaluator">{doc && !heldOnly ? doc.metadata.evaluator : "—"}</Field>
        <Field label="Evaluated at">{doc && !heldOnly ? formatDateTime(doc.metadata.evaluatedAt) : "Not evaluated"}</Field>
      </dl>
      <div className="mt-4 border-t border-line pt-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Evaluation readiness <InfoTip text={TERMS.gate} /></h3>
        <ul className="grid gap-2 sm:grid-cols-3">
          {[
            { k: "Recording gate", s: g.recording.status, d: `${g.recording.audioSec} s of ${g.recording.loggedSec} s (needs ≥ 90%)` },
            { k: "Transcript gate", s: g.transcript.status, d: `${g.transcript.decision.replaceAll("_", " ")} — ${g.transcript.reason} Broken characters: ${g.transcript.brokenChars}; coverage ${(g.transcript.coverage * 100).toFixed(0)}%.${g.transcript.ackBy ? ` Acknowledged by ${g.transcript.ackBy}.` : ""}` },
            { k: "Call-type gate", s: g.callType.status, d: g.callType.status === "pass" ? `Confirmed by ${call.callTypeConfirmedBy}` : "Call type not yet confirmed by a human" },
          ].map((x) => (
            <li key={x.k} className={cn("rounded-lg border p-2.5 text-xs", x.s === "pass" ? "border-good/30 bg-good-soft/40" : x.s === "review" ? "border-warn/30 bg-warn-soft/50" : "border-bad/30 bg-bad-soft/50")}>
              <p className="flex items-center justify-between font-semibold text-ink">{x.k}<Badge tone={x.s === "pass" ? "good" : x.s === "review" ? "warn" : "bad"}>{x.s === "pass" ? "Pass" : x.s === "review" ? "Review" : "Blocked"}</Badge></p>
              <p className="mt-1 text-ink-soft">{x.d}</p>
            </li>
          ))}
        </ul>
        <p className="sr-only">{GATE_LABEL[g.recording.status]}</p>
      </div>
    </Section>
  );
}

function ScoreCardBox({ label, tip, s, accent }: { label: string; tip: string; s: Mrv1Document["scores"]["stage"]; accent?: string }) {
  return (
    <div className="rounded-lg border border-line p-3.5" style={accent ? { borderTopColor: accent, borderTopWidth: 3 } : undefined}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">{label}<InfoTip text={tip} /></p>
      <p className="mt-1.5 text-[28px] leading-none"><ScorePct pct={s.pct} provisional={s.provisional} className="text-[28px]" /></p>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">{s.provisional && <ProvisionalPill />}<span className="tabular">scored {s.scored} · N/A {s.na} · NE {s.ne}</span></p>
    </div>
  );
}

export function S2Performance({ doc }: { doc: Mrv1Document }) {
  const s = doc.scores;
  const ne = [...doc.sales_stage, ...doc.psychology].filter((c) => c.outcome === "NE");
  return (
    <Section id="s2" n={2} title="Overall Performance" desc="Two separate scores. They are never combined into one number.">
      <div className="grid gap-3 md:grid-cols-3">
        <ScoreCardBox label="Sales-stage score" tip={TERMS.stage} s={s.stage} accent="#1d4ed8" />
        <ScoreCardBox label="Sales Psychology & Conduct score" tip={TERMS.psych} s={s.psychology} accent="#0f8b8d" />
        <div className="rounded-lg border border-line p-3.5" style={{ borderTopColor: doc.extras.flags.length ? "#c83232" : "#cbd5e1", borderTopWidth: 3 }}>
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">Critical flags<InfoTip text="Flags are independent of scores and always need a human decision." /></p>
          <p className="tabular mt-1.5 flex items-center gap-2 text-[28px] font-semibold leading-none">{doc.extras.flags.length ? <AlertOctagon className="h-6 w-6 text-bad" /> : null}{doc.extras.flags.length}</p>
          <p className="mt-2 text-xs text-ink-muted">{doc.extras.flags.filter((f) => f.decision === "pending").length} pending a human decision</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-subtle px-3 py-2.5 text-[13px] text-ink-soft">
        <p className="font-medium text-ink">{s.stage.provisional || s.psychology.provisional ? "Why provisional" : "Why final"}</p>
        {ne.length === 0 ? <p className="mt-0.5">No criterion was Not Evaluable, so both scores are final (they still require human review).</p> : (
          <>
            <p className="mt-0.5">{s.stage.ne} sales-stage and {s.psychology.ne} psychology criteria were Not Evaluable. NE is never counted as zero.</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">{ne.map((c) => <li key={c.id}><Badge tone="warn"><EyeOff className="h-3 w-3" />{c.id} · {REASON_LABEL[c.reasonCode!]}</Badge></li>)}</ul>
          </>
        )}
      </div>
      <p className="mt-2 text-2xs text-ink-muted">{TERMS.formula}</p>
    </Section>
  );
}

export const S3Summary = ({ doc }: { doc: Mrv1Document }) => <Section id="s3" n={3} title="Executive Summary"><p className="text-[13px] leading-relaxed text-ink">{doc.extras.executive_summary}</p></Section>;

export function S4Profile({ doc }: { doc: Mrv1Document }) {
  return (
    <Section id="s4" n={4} title="Prospect Profile" desc="What the call established about the prospect, each with its supporting transcript segment.">
      <dl className="divide-y divide-line">
        {doc.extras.prospect_profile.map((f) => (
          <div key={f.label} className="grid gap-1 py-2.5 sm:grid-cols-[170px_1fr_auto] sm:gap-4">
            <dt className="text-xs font-medium text-ink-muted">{f.label}</dt>
            <dd className={cn("text-[13px]", f.value ? "text-ink" : "italic text-ink-muted")}>{f.value ?? "Not established"}</dd>
            <dd>{f.segment ? <JumpButton segments={[f.segment]} label={`Segment ${f.segment}`} /> : null}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

export function S5Scorecard({ doc }: { doc: Mrv1Document }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Section id="s5" n={5} title="Category-wise Scorecard" desc="19 categories, counted equally. Click a row to see its criteria. Hatched rows are not applicable.">
      <ul className="divide-y divide-line rounded-lg border border-line">
        {doc.scores.categories.map((c) => {
          const def = CATEGORIES.find((x) => x.id === c.id)!;
          const na = c.pct === null && c.na > 0 && c.scored === 0;
          const isOpen = open === c.id;
          return (
            <li key={c.id} className={cn(na && "bg-subtle/50")}>
              <button onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 px-3 py-2.5 text-left hover:bg-subtle/60 sm:grid-cols-[minmax(0,210px)_1fr_48px_156px_16px]">
                <span className={cn("min-w-0 truncate text-[13px] font-medium", na ? "text-ink-muted" : "text-ink")}><span className="tabular mr-1.5 text-xs text-ink-muted">{c.id}</span>{def.name}</span>
                <span className="order-last col-span-2 h-2.5 overflow-hidden rounded-full bg-line sm:order-none sm:col-span-1" role="meter" aria-label={`${def.name} score`} aria-valuenow={c.pct ?? 0} aria-valuemin={0} aria-valuemax={100}>
                  {c.pct === null ? <span className="block h-full w-full" style={{ background: hatch }} /> : <span className="block h-full rounded-full" style={{ width: `${c.pct}%`, background: scoreColor(Math.max(30, c.pct)) }} />}
                </span>
                <span className="tabular text-right text-[13px] font-semibold">{c.pct === null ? <span className="flex items-center justify-end gap-1 text-xs font-medium text-ink-muted">{na ? <><MinusCircle className="h-3 w-3" />N/A</> : <><EyeOff className="h-3 w-3" />NE</>}</span> : `${c.pct.toFixed(0)}%`}</span>
                <span className="hidden items-center gap-2 text-xs text-ink-muted sm:flex"><span className="tabular whitespace-nowrap">scored {c.scored} · N/A {c.na} · NE {c.ne}</span>{c.ne > 0 && <Term tip={TERMS.provisional}><span className="h-2 w-2 rounded-full bg-warn inline-block" aria-label="provisional" /></Term>}</span>
                <ChevronDown className={cn("hidden h-4 w-4 text-ink-muted transition-transform sm:block", isOpen && "rotate-180")} />
              </button>
              {isOpen && <div className="space-y-1.5 border-t border-line bg-surface px-3 py-2.5">{doc.sales_stage.filter((k) => k.categoryId === c.id).map((k) => <CriterionRow key={k.id} c={k} />)}</div>}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-2xs text-ink-muted">{FLAG_BY_ID.false_earnings_promise ? "Amber dot = category contains at least one Not Evaluable criterion (provisional)." : ""}</p>
    </Section>
  );
}
