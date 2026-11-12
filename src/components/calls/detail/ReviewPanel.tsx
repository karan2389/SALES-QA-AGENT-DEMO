"use client";
import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Flag, MessageSquare, PencilLine, ShieldAlert } from "lucide-react";
import { Badge, ReviewStatusBadge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { CATEGORIES, CATEGORY_BY_ID } from "@/config/rubric";
import { formatDateTime } from "@/lib/dates";
import { updateManagerReview } from "@/services";
import type { CallDetail, CategoryId, ManagerReview, ReviewAction } from "@/types";

const ACTION_META: Record<ReviewAction, { label: string; icon: typeof CheckCircle2; tone: "good" | "bad" | "brand" | "warn" | "neutral" }> = {
  approved: { label: "Approved evaluation", icon: CheckCircle2, tone: "good" },
  disputed: { label: "Disputed evaluation", icon: ShieldAlert, tone: "bad" },
  note: { label: "Added note", icon: MessageSquare, tone: "neutral" },
  score_corrected: { label: "Corrected a score", icon: PencilLine, tone: "brand" },
  marked_for_review: { label: "Marked for review", icon: Flag, tone: "warn" },
};

type Pending = null | { kind: "approve" } | { kind: "dispute" } | { kind: "correct" };

export function ReviewPanel({ detail }: { detail: CallDetail }) {
  const toast = useToast();
  const { call, evaluation, reviews } = detail;
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<CategoryId>("objection");
  const [score, setScore] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const current = evaluation?.categoryScores[category].score;
  const scoreNum = score === "" ? current : Number(score);
  const scoreValid = scoreNum !== undefined && !Number.isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100;

  async function run(action: ReviewAction, opts: { notes?: string; correction?: { category: CategoryId; to: number } }, success: string, description?: string) {
    setBusy(true);
    try {
      await updateManagerReview({ callId: call.id, action, ...opts });
      toast({ tone: "success", title: success, description });
      setPending(null); setReason(""); setNotes(action === "note" ? "" : notes);
      if (action === "score_corrected") setScore("");
    } catch (e) {
      toast({ tone: "error", title: "Action not saved", description: e instanceof Error ? e.message : "Unexpected error" });
    } finally { setBusy(false); }
  }

  const locked = !evaluation;

  return (
    <>
      <Card>
        <CardHeader title="Manager review" description="Changes are saved to this browser only (mock state)" actions={<ReviewStatusBadge status={call.reviewStatus} />} />
        <div className="space-y-4 px-4 pb-4">
          {locked && <p className="rounded-md bg-subtle px-3 py-2 text-[13px] text-ink-muted">Approve, dispute and score correction become available once an evaluation exists. You can still flag this call for review.</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="success" disabled={locked || call.reviewStatus === "approved"} onClick={() => setPending({ kind: "approve" })} className="justify-center"><CheckCircle2 className="h-4 w-4" />Approve</Button>
            <Button variant="danger" disabled={locked || call.reviewStatus === "disputed"} onClick={() => setPending({ kind: "dispute" })} className="justify-center"><ShieldAlert className="h-4 w-4" />Dispute</Button>
          </div>
          {call.reviewStatus !== "pending_review" && call.evaluationStatus !== "processing" && (
            <Button size="sm" className="w-full justify-center" disabled={busy} onClick={() => run("marked_for_review", { notes: "Flagged for review from call report." }, "Marked for review", "The call now appears in the Review Centre.")}><Flag className="h-3.5 w-3.5" />Mark for review</Button>
          )}

          <div>
            <label htmlFor="review-notes" className="text-xs font-medium text-ink-muted">Review notes</label>
            <Textarea id="review-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context for the team — e.g. why a score looks right or wrong…" className="mt-1" />
            <Button size="sm" className="mt-2" disabled={!notes.trim() || busy} onClick={() => run("note", { notes }, "Note saved", "Added to the review history.")}><ClipboardCheck className="h-3.5 w-3.5" />Save note</Button>
          </div>

          <fieldset disabled={locked} className="border-t border-line pt-3 disabled:opacity-60">
            <legend className="text-xs font-medium text-ink-muted">Correct a category score</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Select aria-label="Category to correct" value={category} onChange={(e) => { setCategory(e.target.value as CategoryId); setScore(""); }} className="min-w-0 flex-1 basis-[180px]">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
              <Input aria-label="Corrected score" type="number" min={0} max={100} value={score} placeholder={current !== undefined ? String(current) : "0–100"} onChange={(e) => setScore(e.target.value)} className="w-20" />
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">Current: <span className="tabular font-medium text-ink">{current ?? "—"}</span>. The overall score is recalculated from the weighted categories.</p>
            <Button size="sm" className="mt-2" disabled={!scoreValid || scoreNum === current} onClick={() => setPending({ kind: "correct" })}><PencilLine className="h-3.5 w-3.5" />Apply correction</Button>
          </fieldset>
        </div>

        <div className="border-t border-line px-4 py-3">
          <h3 className="mb-2 text-[13px] font-semibold">Review history <span className="font-normal text-ink-muted">({reviews.length})</span></h3>
          {reviews.length === 0 ? <p className="text-[13px] text-ink-muted">No review activity yet.</p> : (
            <ol className="space-y-3">
              {reviews.map((r: ManagerReview) => {
                const m = ACTION_META[r.status];
                const Icon = m.icon;
                return (
                  <li key={r.id} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-subtle text-ink-soft"><Icon className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0 text-[13px]">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="font-medium text-ink">{r.reviewer}</span><Badge tone={m.tone}>{m.label}</Badge></p>
                      <p className="text-xs text-ink-muted">{formatDateTime(r.reviewedAt)}</p>
                      {r.correction && <p className="mt-1 text-ink-soft">{CATEGORY_BY_ID[r.correction.category].label}: <span className="tabular font-medium">{r.correction.from} → {r.correction.to}</span></p>}
                      {r.notes && <p className="mt-1 whitespace-pre-wrap text-ink-soft">{r.notes}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Card>

      <Dialog open={pending?.kind === "approve"} title="Approve this evaluation?" confirmLabel="Approve" confirmVariant="success" loading={busy} onClose={() => setPending(null)}
        description="Confirms the score and feedback are accurate. Review status becomes “Approved” and the call leaves the review queue."
        onConfirm={() => run("approved", { notes: notes.trim() || undefined }, "Evaluation approved", `${call.id} is now approved.`)} />
      <Dialog open={pending?.kind === "dispute"} title="Dispute this evaluation?" confirmLabel="Mark as disputed" confirmVariant="danger" loading={busy} confirmDisabled={!reason.trim()} onClose={() => setPending(null)}
        description="Explain what looks wrong so the team can investigate. The call is added to the disputed list in the Review Centre."
        onConfirm={() => run("disputed", { notes: reason }, "Evaluation marked as disputed", "Your reason was added to the review history.")}>
        <label htmlFor="dispute-reason" className="text-xs font-medium text-ink-muted">Reason (required)</label>
        <Textarea id="dispute-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1" placeholder="e.g. Speaker labels are wrong around the objection…" />
      </Dialog>
      <Dialog open={pending?.kind === "correct"} title="Apply score correction?" confirmLabel="Apply correction" loading={busy} onClose={() => setPending(null)}
        description={`${CATEGORY_BY_ID[category].label}: ${current} → ${scoreNum}. The overall score will be recalculated. The original model score is kept in the history.`}
        onConfirm={() => run("score_corrected", { notes: notes.trim() || undefined, correction: { category, to: Number(scoreNum) } }, "Score corrected", `${CATEGORY_BY_ID[category].label} is now ${scoreNum}.`)} />
    </>
  );
}
