"use client";
import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Pencil, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge, OutcomeChip, ReviewChip } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { CALL_TYPES } from "@/config/mrv1";
import { formatDateTime } from "@/lib/dates";
import { updateManagerReview, type ReviewInput } from "@/services";
import type { CallType, CriterionEval } from "@/types";
import { useReport } from "./ctx";
import { CorrectionDialog } from "./CorrectionDialog";
import { Section } from "./primitives";

const LABEL: Record<string, string> = { approve: "Approved", dispute: "Disputed", note: "Added note", correct_criterion: "Corrected a criterion", flag_decision: "Flag decision", confirm_call_type: "Confirmed call type", ack_gate: "Acknowledged transcript gate" };

export function S14Review({ heldOnly }: { heldOnly?: boolean }) {
  const toast = useToast();
  const { record, actions } = useReport();
  const { call, doc } = record;
  const [notes, setNotes] = useState("");
  const [dialog, setDialog] = useState<null | "approve" | "dispute" | "type" | "ack">(null);
  const [reason, setReason] = useState("");
  const [type, setType] = useState<CallType>("new_webinar_prospect");
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<string>("");
  const [correcting, setCorrecting] = useState<CriterionEval | null>(null);
  const evaluated = !!doc && !heldOnly;

  async function run(input: Omit<ReviewInput, "callId">, ok: string, desc?: string) {
    setBusy(true);
    try { await updateManagerReview({ callId: call.id, ...input }); toast({ tone: "success", title: ok, description: desc ?? "Saved in this browser only (mock)." }); setDialog(null); setReason(""); if (input.kind === "note") setNotes(""); }
    catch (e) { toast({ tone: "error", title: "Action not saved", description: e instanceof Error ? e.message : undefined }); } finally { setBusy(false); }
  }
  const all = doc ? [...doc.sales_stage, ...doc.psychology] : [];
  const unscored = !!call.heldReason?.includes("not scored");
  return (
    <Section id="s14" n={14} title="Human Review" desc="Every evaluation starts as “Pending human review”. Nothing is approved by the AI.">
      <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-ink-muted">Status</span><ReviewChip status={evaluated ? doc.human_review.status : null} />{!evaluated && <Badge tone="warn">No evaluation to review</Badge>}</div>

      {(call.gates.callType.status === "blocked" || call.gates.transcript.status === "review") && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-warn/30 bg-warn-soft/50 p-3 text-[13px]">
          <ShieldAlert className="h-4 w-4 text-warn" /><span className="mr-auto text-ink">{call.gates.callType.status === "blocked" ? "A human must confirm the call type before this call can be evaluated." : "A human must acknowledge the transcript gate before this call can be evaluated."}</span>
          {call.gates.callType.status === "blocked" && <Button size="sm" variant="primary" onClick={() => setDialog("type")}>Confirm call type</Button>}
          {call.gates.transcript.status === "review" && <Button size="sm" variant="primary" onClick={() => setDialog("ack")}>Acknowledge transcript gate</Button>}
        </div>
      )}

      {evaluated && doc && (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div><h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Verify</h3>
              <ul className="space-y-1.5 text-[13px]">{doc.extras.needs_human_verification.map((v, i) => <li key={i} className="flex gap-2"><ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />Verify: {v}</li>)}</ul></div>
            <div><h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Validation</h3>
              {doc.validation.warnings.length ? <ul className="space-y-1.5 text-[13px]">{doc.validation.warnings.map((w, i) => <li key={i} className="flex gap-2 text-warn"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}</li>)}</ul> : <p className="text-[13px] text-ink-muted">No validation warnings.</p>}
              {doc.validation.adjustments.length > 0 && <ul className="mt-1.5 list-disc pl-5 text-xs text-ink-muted">{doc.validation.adjustments.map((a, i) => <li key={i}>{a}</li>)}</ul>}
              <p className="tabular mt-2 text-xs text-ink-muted">Criteria total: {doc.validation.criteriaTotal} (70 sales-stage + 22 psychology)</p></div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div><label htmlFor="rev-notes" className="text-xs font-medium text-ink-muted">Reviewer notes</label>
              <Textarea id="rev-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="Add context for the team…" />
              <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" disabled={!notes.trim() || busy} onClick={() => run({ kind: "note", notes }, "Note saved")}>Save note</Button>
                <Button size="sm" variant="success" disabled={doc.human_review.status === "approved"} onClick={() => setDialog("approve")}><CheckCircle2 className="h-3.5 w-3.5" />Approve</Button>
                <Button size="sm" variant="danger" disabled={doc.human_review.status === "disputed"} onClick={() => setDialog("dispute")}><ShieldAlert className="h-3.5 w-3.5" />Dispute</Button></div></div>
            <div><label htmlFor="corr-pick" className="text-xs font-medium text-ink-muted">Correct a criterion outcome</label>
              <Select id="corr-pick" aria-label="Criterion to correct" value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1"><option value="">Choose a criterion…</option>{all.map((c) => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}</Select>
              <Button size="sm" className="mt-2" disabled={!target} onClick={() => setCorrecting(all.find((c) => c.id === target) ?? null)}><Pencil className="h-3.5 w-3.5" />Correct outcome…</Button>
              {all.some((c) => c.review.status === "corrected") && <ul className="mt-2 space-y-1 text-xs">{all.filter((c) => c.review.status === "corrected").map((c) => <li key={c.id} className="flex items-center gap-1.5">{c.id}: <OutcomeChip outcome={c.modelOutcome} struck />→<OutcomeChip outcome={c.outcome} /><span className="text-ink-muted">{c.review.reason}</span></li>)}</ul>}</div>
          </div>
        </>
      )}

      {!evaluated && !unscored && call.status !== "processing" && <div className="mt-4"><label htmlFor="rev-notes2" className="text-xs font-medium text-ink-muted">Reviewer notes</label><Textarea id="rev-notes2" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" /><Button size="sm" className="mt-2" disabled={!notes.trim() || busy} onClick={() => run({ kind: "note", notes }, "Note saved")}>Save note</Button></div>}

      <div className="mt-5 border-t border-line pt-3"><h3 className="mb-2 text-[13px] font-semibold">Review history <span className="font-normal text-ink-muted">({actions.length})</span></h3>
        {actions.length === 0 ? <p className="text-[13px] text-ink-muted">No human review activity yet.</p> : (
          <ol className="space-y-2.5">{actions.map((a) => (
            <li key={a.id} className="flex gap-2.5 text-[13px]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" /><div><p><span className="font-medium">{a.by}</span> · {LABEL[a.kind]}{a.criterionId && ` ${a.criterionId}: ${String(a.from)} → ${String(a.to)}`}{a.decision && ` (${a.decision.replaceAll("_", " ")})`}{a.callType && ` → ${a.callType.replaceAll("_", " ")}`}</p><p className="text-xs text-ink-muted">{formatDateTime(a.at)}</p>{a.notes && <p className="mt-0.5 text-ink-soft">{a.notes}</p>}</div></li>))}</ol>)}
      </div>

      <Dialog open={dialog === "approve"} title="Approve this evaluation?" confirmLabel="Approve" confirmVariant="success" loading={busy} onClose={() => setDialog(null)} onConfirm={() => run({ kind: "approve", notes: notes.trim() || undefined }, "Approved by human reviewer")} description="You confirm the scores, flags and findings have been checked. This is a human approval, not an AI one." />
      <Dialog open={dialog === "dispute"} title="Dispute this evaluation?" confirmLabel="Mark as disputed" confirmVariant="danger" loading={busy} confirmDisabled={!reason.trim()} onClose={() => setDialog(null)} onConfirm={() => run({ kind: "dispute", notes: reason }, "Evaluation disputed")} description="Explain what looks wrong so it can be investigated.">
        <label htmlFor="dispute-reason" className="text-xs font-medium text-ink-muted">Reason (required)</label><Textarea id="dispute-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1" /></Dialog>
      <Dialog open={dialog === "type"} title="Confirm call type" confirmLabel="Confirm call type" loading={busy} onClose={() => setDialog(null)} onConfirm={() => run({ kind: "confirm_call_type", callType: type }, "Call type confirmed", "Mock action — saved in this browser only.")} description="An evaluation is only valid once a human confirms the call type. Continuation calls treat C01 and C02 as N/A.">
        <Select aria-label="Call type" value={type} onChange={(e) => setType(e.target.value as CallType)}>{CALL_TYPES.map((c) => <option key={c.id} value={c.id}>{c.label}{c.note ? ` — ${c.note}` : ""}</option>)}</Select></Dialog>
      <Dialog open={dialog === "ack"} title="Acknowledge transcript gate?" confirmLabel="Acknowledge and proceed" loading={busy} onClose={() => setDialog(null)} onConfirm={() => run({ kind: "ack_gate" }, "Transcript gate acknowledged")} description={`${call.gates.transcript.reason} By acknowledging you accept that the transcript may be incomplete; scores stay provisional.`} />
      <CorrectionDialog open={!!correcting} criterion={correcting} onClose={() => setCorrecting(null)} />
    </Section>
  );
}
