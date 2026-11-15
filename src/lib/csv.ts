import { CALL_TYPE_LABEL, FLAGS } from "@/config/mrv1";
import { EVAL_STATUS_LABEL, REVIEW_LABEL } from "@/config/ui";
import type { Dataset, ReviewAction, Row } from "@/types";
import { formatDateTime } from "./dates";
import { fmtScore } from "./scoring";

const esc = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s; // neutralise spreadsheet formula injection
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export const toCsv = (headers: string[], rows: (string | number | null | undefined)[][]) => [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
export function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const downloadCsv = downloadText;
export const stamp = () => new Date().toISOString().slice(0, 10);
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Mirrors the Google Sheet row: Call ID · Date · Agent · Call type · Overall · Transcript · Feedback · Status · Review. */
export function callsToCsv(rows: Row[]): string {
  const body = rows.map((r) => {
    const d = r.doc;
    const transcript = r.rec.transcript?.segments.map((s) => `[${clock(s.start)}] ${s.speaker === "unclear" ? "Uncertain speaker" : s.speaker}: ${s.text}`).join("\n") ?? "";
    const feedback = d ? [
      `Psychology score: ${fmtScore(d.scores.psychology.pct, d.scores.psychology.provisional)}`,
      "Category scores: " + d.scores.categories.map((c) => `${c.id} ${c.pct === null ? "n/a" : c.pct.toFixed(0) + "%"} (scored ${c.scored}/NA ${c.na}/NE ${c.ne})`).join("; "),
      "Flags: " + (d.extras.flags.length ? d.extras.flags.map((f) => `${f.flagId} [${f.severity}, ${f.interpretation}, ${f.decision}]`).join("; ") : "none"),
    ].join("\n") : "";
    return [r.call.id, formatDateTime(r.call.callDate), r.salesperson.name, CALL_TYPE_LABEL[r.call.callType], d ? fmtScore(d.scores.stage.pct, d.scores.stage.provisional) : "", transcript, feedback,
      r.call.heldReason ? `${EVAL_STATUS_LABEL[r.call.status]} — ${r.call.heldReason}` : EVAL_STATUS_LABEL[r.call.status], d ? REVIEW_LABEL[d.human_review.status] : ""];
  });
  return toCsv(["Call ID", "Date", "Agent", "Call type", "Overall (sales-stage score, provisional)", "Transcript (timestamped)", "Feedback (psychology score, category scores, flags)", "Status", "Review"], body);
}

export function criteriaToCsv(rows: Row[]): string {
  const body = rows.flatMap((r) => (r.doc ? [...r.doc.sales_stage, ...r.doc.psychology].map((c) => [
    r.call.id, r.salesperson.name, c.id, c.name, c.categoryId, c.outcome === "NA" ? "N/A" : c.outcome, c.modelOutcome === c.outcome ? "" : (c.modelOutcome === "NA" ? "N/A" : c.modelOutcome), c.reasonCode ?? "", c.evidenceConfidence ?? "",
    c.quotes.map((q) => `[${clock(q.start)}–${clock(q.end)}] (${q.speaker}, seg ${q.segments.join(",")}) ${q.text}`).join(" | ") || (c.absence ? `ABSENCE: ${c.absence.note}` : "No evidence"), c.explanation, c.improvement ?? "",
  ]) : []));
  return toCsv(["Call ID", "Salesperson", "Criterion ID", "Criterion", "Category", "Outcome (effective)", "Engine outcome (if corrected)", "Reason code", "Evidence confidence", "Evidence", "Explanation", "Improvement"], body);
}

export function flagsToCsv(rows: Row[]): string {
  const body = rows.flatMap((r) => (r.doc ? r.doc.extras.flags.map((f) => [r.call.id, r.salesperson.name, f.flagId, FLAGS.find((x) => x.id === f.flagId)!.label, f.severity, f.interpretation, f.verification, f.decision, f.decidedBy ?? "", clock(f.quote.start), f.quote.text, f.explanation, f.capsCriteria.join(" ")]) : []));
  return toCsv(["Call ID", "Salesperson", "Flag ID", "Flag", "Severity", "Interpretation", "Verification", "Human decision", "Decided by", "Timestamp", "Quote", "Explanation", "Capped criteria"], body);
}

export function reviewLogToCsv(ds: Dataset): string {
  return toCsv(["Action ID", "Call ID", "By", "Action", "Detail", "Notes", "At"], ds.actions.map((a: ReviewAction) => [a.id, a.callId, a.by, a.kind, [a.callType, a.flagId && `${a.flagId}: ${a.decision}`, a.criterionId && `${a.criterionId}: ${a.from} -> ${a.to}`].filter(Boolean).join(" "), a.notes ?? "", formatDateTime(a.at)]));
}


