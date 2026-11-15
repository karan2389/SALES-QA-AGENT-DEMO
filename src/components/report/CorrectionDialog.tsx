"use client";
import { useState } from "react";
import { OutcomeChip } from "@/components/ui/Badges";
import { Dialog } from "@/components/ui/Dialog";
import { Select, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { updateManagerReview } from "@/services";
import type { CriterionEval, Outcome } from "@/types";
import { useReport } from "./ctx";

const OPTIONS: { v: string; label: string }[] = [
  { v: "3", label: "3 — Fully demonstrated" }, { v: "2", label: "2 — Mostly demonstrated" }, { v: "1", label: "1 — Weakly demonstrated" }, { v: "0", label: "0 — Not demonstrated" }, { v: "NA", label: "N/A — Not applicable" }, { v: "NE", label: "NE — Not evaluable" },
];
const parse = (v: string): Outcome => (v === "NA" || v === "NE" ? v : (Number(v) as Outcome));

/** Human correction: the engine's original outcome is kept and shown struck through. A reason is required. */
export function CorrectionDialog({ open, criterion, onClose }: { open: boolean; criterion: CriterionEval | null; onClose: () => void }) {
  const toast = useToast();
  const { record } = useReport();
  const [to, setTo] = useState("2");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!criterion) return null;
  const submit = async () => {
    setBusy(true);
    try {
      await updateManagerReview({ callId: record.call.id, kind: "correct_criterion", criterionId: criterion.id, from: criterion.outcome, to: parse(to), notes: reason });
      toast({ tone: "success", title: `${criterion.id} corrected`, description: `Engine outcome ${String(criterion.modelOutcome)} is kept in the record; scores were recalculated.` });
      setReason(""); onClose();
    } catch (e) { toast({ tone: "error", title: "Correction not saved", description: e instanceof Error ? e.message : undefined }); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} title={`Correct ${criterion.id}`} onClose={onClose} confirmLabel="Apply correction" loading={busy} confirmDisabled={!reason.trim() || parse(to) === criterion.outcome} onConfirm={submit}
      description={`${criterion.name}. The engine's original outcome stays on record and is shown struck through; it is never overwritten.`}>
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-[13px]">Current outcome: <OutcomeChip outcome={criterion.outcome} /></p>
        <Select aria-label="Corrected outcome" value={to} onChange={(e) => setTo(e.target.value)}>{OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}</Select>
        <div><label htmlFor="corr-reason" className="text-xs font-medium text-ink-muted">Reason (required)</label><Textarea id="corr-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1" placeholder="Why is the model outcome wrong?" /></div>
      </div>
    </Dialog>
  );
}
