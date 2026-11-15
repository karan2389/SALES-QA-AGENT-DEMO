"use client";
import { useState } from "react";
import { AlertOctagon, CheckCircle2, Lightbulb, MessageCircleWarning, Target } from "lucide-react";
import { Badge, SeverityBadge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_BY_ID, FLAG_BY_ID, OBJECTION_LABEL, OBJECTION_OUTCOME_LABEL } from "@/config/mrv1";
import { updateManagerReview } from "@/services";
import type { FlagItem, Mrv1Document } from "@/types";
import { useReport } from "./ctx";
import { JumpButton, QuoteBlock, Section, mmss } from "./primitives";

export function S8Objections({ doc }: { doc: Mrv1Document }) {
  const tone = { handled_well: "good", partially: "warn", poorly: "bad", unclear: "neutral" } as const;
  return (
    <Section id="s8" n={8} title="Objection Analysis">
      {doc.extras.objections.length === 0 ? <p className="text-[13px] text-ink-muted">No objection was raised in this call.</p> : (
        <ul className="space-y-3">{doc.extras.objections.map((o, i) => (
          <li key={i} className="rounded-lg border border-line p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-[13px] font-semibold">{OBJECTION_LABEL[o.type]}</span><Badge tone={tone[o.outcome]}>{OBJECTION_OUTCOME_LABEL[o.outcome]}</Badge></div>
            <QuoteBlock q={o.quote} /><p className="mt-2 text-[13px] text-ink">{o.handling}</p>
          </li>))}</ul>
      )}
      <p className="mt-3 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">Approved Objection Doc not yet available; accuracy of responses needs human verification.</p>
    </Section>
  );
}

function Bullets({ id, n, title, items, icon: Icon, tone }: { id: string; n: number; title: string; items: Mrv1Document["extras"]["strengths"]; icon: typeof CheckCircle2; tone: string }) {
  return (
    <Section id={id} n={n} title={title}>
      {items.length === 0 ? <p className="text-[13px] text-ink-muted">Nothing to report for this call.</p> : (
        <ul className="grid gap-2.5 md:grid-cols-3">{items.map((b, i) => (
          <li key={i} className={`rounded-lg border p-3 ${tone}`}><p className="flex gap-2 text-[13px] text-ink"><Icon className="mt-0.5 h-4 w-4 shrink-0" />{b.text}</p><div className="mt-2"><JumpButton segments={b.segments} label={`Segment ${b.segments.join(", ")}`} /></div></li>))}</ul>
      )}
    </Section>
  );
}
export const S9Well = ({ doc }: { doc: Mrv1Document }) => <Bullets id="s9" n={9} title="What Went Well" items={doc.extras.strengths} icon={CheckCircle2} tone="border-good/25 bg-good-soft/30" />;
export const S10Missed = ({ doc }: { doc: Mrv1Document }) => <Bullets id="s10" n={10} title="Missed Opportunities" items={doc.extras.missed_opportunities} icon={Target} tone="border-warn/25 bg-warn-soft/30" />;

function FlagCard({ f }: { f: FlagItem }) {
  const toast = useToast();
  const { record } = useReport();
  const def = FLAG_BY_ID[f.flagId];
  const [busy, setBusy] = useState(false);
  const act = async (decision: "confirmed" | "dismissed" | "needs_audio_check") => {
    setBusy(true);
    try { await updateManagerReview({ callId: record.call.id, kind: "flag_decision", flagId: f.id, decision }); toast({ tone: "success", title: decision === "needs_audio_check" ? "Marked: needs audio check" : `Flag ${decision}`, description: "Saved in this browser only (mock)." }); }
    catch (e) { toast({ tone: "error", title: "Not saved", description: e instanceof Error ? e.message : undefined }); } finally { setBusy(false); }
  };
  return (
    <li className="rounded-lg border border-bad/30 bg-bad-soft/30 p-3">
      <div className="flex flex-wrap items-center gap-2"><AlertOctagon className="h-4 w-4 text-bad" /><span className="text-[13px] font-semibold text-ink">{def.label}</span><code className="text-2xs text-ink-muted">{f.flagId}</code>
        <SeverityBadge severity={f.severity} /><Badge>{f.interpretation === "confirmed" ? "Interpretation: confirmed" : "Interpretation: ambiguous"}</Badge>
        <Badge tone={f.verification === "verified" ? "good" : "warn"}>{f.verification === "verified" ? "Verified in transcript" : "Needs audio check"}</Badge>
        <Badge tone={f.decision === "pending" ? "neutral" : f.decision === "confirmed" ? "bad" : "good"}>Human decision: {f.decision}{f.decidedBy ? ` (${f.decidedBy})` : ""}</Badge></div>
      <div className="mt-2.5"><QuoteBlock q={f.quote} /></div>
      <p className="mt-2 text-[13px] text-ink"><span className="font-medium">Explanation: </span>{f.explanation} <span className="text-ink-muted">Timestamp {mmss(f.quote.start, f.quote.end)}.</span></p>
      {f.capsCriteria.length > 0 && <p className="mt-1.5 text-[13px] text-bad">Score cap: {f.capsCriteria.map((id) => `${id} capped at ${def.caps.find((c) => c.criterion === id)?.cap} because of flag ${f.flagId}`).join("; ")}.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="danger" disabled={busy || f.decision === "confirmed"} onClick={() => act("confirmed")}>Confirm</Button>
        <Button size="sm" disabled={busy || f.decision === "dismissed"} onClick={() => act("dismissed")}>Dismiss</Button>
        <Button size="sm" variant="ghost" disabled={busy || f.verification === "needs_audio_check"} onClick={() => act("needs_audio_check")}>Needs audio check</Button>
      </div>
    </li>
  );
}
export function S11Flags({ doc }: { doc: Mrv1Document }) {
  return (
    <Section id="s11" n={11} title="Critical Flags" desc="Flags are independent of scores and always need a human decision. Decisions are saved in this browser only.">
      {doc.extras.flags.length === 0 ? <p className="flex items-center gap-2 text-[13px] text-ink-muted"><CheckCircle2 className="h-4 w-4 text-good" />No critical flags were raised in this call.</p> : <ul className="space-y-3">{doc.extras.flags.map((f) => <FlagCard key={f.id} f={f} />)}</ul>}
    </Section>
  );
}
export function S12Coaching({ doc }: { doc: Mrv1Document }) {
  const items = doc.extras.coaching_priorities.slice(0, 3);
  return (
    <Section id="s12" n={12} title="Personal Coaching Plan" desc="Up to 3 priorities.">
      {items.length === 0 ? <p className="text-[13px] text-ink-muted">No coaching priorities for this call.</p> : (
        <ol className="space-y-3">{items.map((c, i) => (
          <li key={i} className="rounded-lg border border-line p-3">
            <p className="flex items-center gap-2 text-[13px] font-semibold"><span className="tabular flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-xs text-brand">{i + 1}</span>{CATEGORY_BY_ID[c.categoryId].name}</p>
            <dl className="mt-2 space-y-1.5 text-[13px]"><div><dt className="inline font-medium text-ink-muted">Observed issue: </dt><dd className="inline">{c.issue}</dd></div><div><dt className="inline font-medium text-ink-muted">Recommended action: </dt><dd className="inline">{c.action}</dd></div></dl>
            <div className="mt-2 rounded-md bg-brand-soft/60 p-2.5 text-[13px]"><p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand"><Lightbulb className="h-3.5 w-3.5" />Better-behaviour example</p><p className="italic text-ink">“{c.example}”</p></div>
            <div className="mt-2"><JumpButton segments={c.segments} label={`Segment ${c.segments.join(", ")}`} /></div>
          </li>))}</ol>
      )}
    </Section>
  );
}
export const S13Note = ({ doc }: { doc: Mrv1Document }) => <Section id="s13" n={13} title="Final Coaching Note"><p className="flex gap-2 text-[13px] leading-relaxed"><MessageCircleWarning className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{doc.extras.final_coaching_note}</p></Section>;
