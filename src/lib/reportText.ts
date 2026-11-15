import { CALL_TYPE_LABEL, CATEGORIES, FLAG_BY_ID, OBJECTION_LABEL, OBJECTION_OUTCOME_LABEL, REASON_LABEL } from "@/config/mrv1";
import type { CallRecord, CriterionEval, Salesperson } from "@/types";
import { formatDateTime, formatDuration, formatClock } from "./dates";
import { fmtScore, outcomeLabel } from "./scoring";

const q = (c: CriterionEval) => c.quotes.map((x) => `    [${formatClock(x.start)}–${formatClock(x.end)}] (${x.speaker}, segment ${x.segments.join(",")}) "${x.text}"`).join("\n");
const crit = (c: CriterionEval) => `  ${c.id} ${c.name}: ${outcomeLabel(c.outcome)}${c.modelOutcome !== c.outcome ? ` (engine: ${outcomeLabel(c.modelOutcome)}, corrected by ${c.review.by}: ${c.review.reason})` : ""}${c.reasonCode ? ` [${REASON_LABEL[c.reasonCode]}]` : ""}\n${q(c) || (c.absence ? `    ABSENCE: ${c.absence.note}` : "    No evidence")}\n    ${c.explanation}${c.improvement ? `\n    Improve: ${c.improvement}` : ""}`;

/** Plain-text version of the 14-section report ("Copy as text" / "Download report"). */
export function reportToText(rec: CallRecord, sp: Salesperson): string {
  const { call, doc } = rec;
  const L: string[] = [];
  L.push("AI-assisted evaluation. Every score, flag and finding requires human review. (Illustrative mock data)", "");
  L.push("1. CALL DETAILS", `Callyzer call ID: ${call.id}`, `Call type: ${CALL_TYPE_LABEL[call.callType]}${call.callTypeConfirmedBy ? ` (confirmed by ${call.callTypeConfirmedBy})` : " (unconfirmed)"}`,
    `Salesperson: ${sp.name}`, `Date: ${formatDateTime(call.callDate)}`, `Recording: ${call.gates.recording.audioSec} s of ${call.gates.recording.loggedSec} s (${formatDuration(call.durationSec)} logged)`);
  if (!doc || call.status !== "evaluated") { L.push("", `No normal sales-stage evaluation was generated. ${call.heldReason ?? ""}`); return L.join("\n"); }
  const s = doc.scores;
  L.push(`Transcript: ${doc.transcript_quality.source}, ${doc.transcript_quality.language}, coverage ${(doc.transcript_quality.coverage * 100).toFixed(0)}% (coverage, not accuracy)`, `Rubric: ${doc.metadata.rubricVersion}`, `Evaluator: ${doc.metadata.evaluator}`, `Evaluated at: ${formatDateTime(doc.metadata.evaluatedAt)}`, "");
  L.push("2. OVERALL PERFORMANCE", `Sales-stage score: ${fmtScore(s.stage.pct, s.stage.provisional)}`, `Sales Psychology & Conduct score: ${fmtScore(s.psychology.pct, s.psychology.provisional)}`, `Critical flags: ${doc.extras.flags.length}`, `Not evaluable criteria: ${s.stage.ne} (sales-stage), ${s.psychology.ne} (psychology)`, "");
  L.push("3. EXECUTIVE SUMMARY", doc.extras.executive_summary, "");
  L.push("4. PROSPECT PROFILE", ...doc.extras.prospect_profile.map((f) => `${f.label}: ${f.value ?? "Not established"}${f.segment ? ` (segment ${f.segment})` : ""}`), "");
  L.push("5. CATEGORY-WISE SCORECARD", ...s.categories.map((c) => `${c.id} ${CATEGORIES.find((x) => x.id === c.id)!.name}: ${c.pct === null ? "n/a" : c.pct.toFixed(1) + "%"} (scored ${c.scored} · N/A ${c.na} · NE ${c.ne})`), "");
  L.push("6. DETAILED CRITERION EVALUATION", ...CATEGORIES.flatMap((c) => [`${c.id} ${c.name}`, ...doc.sales_stage.filter((x) => x.categoryId === c.id).map(crit)]), "");
  L.push("7. SALES PSYCHOLOGY & CONDUCT", ...doc.psychology.map(crit), "");
  L.push("8. OBJECTION ANALYSIS", ...doc.extras.objections.map((o) => `${OBJECTION_LABEL[o.type]} — ${OBJECTION_OUTCOME_LABEL[o.outcome]}: "${o.quote.text}" ${o.handling}`), "(Approved Objection Doc not yet available; accuracy of responses needs human verification.)", "");
  L.push("9. WHAT WENT WELL", ...doc.extras.strengths.map((b) => `- ${b.text} (segments ${b.segments.join(",")})`), "");
  L.push("10. MISSED OPPORTUNITIES", ...doc.extras.missed_opportunities.map((b) => `- ${b.text} (segments ${b.segments.join(",")})`), "");
  L.push("11. CRITICAL FLAGS", ...(doc.extras.flags.length ? doc.extras.flags.map((f) => `${FLAG_BY_ID[f.flagId].label} [${f.severity}, ${f.interpretation}, ${f.verification}] decision: ${f.decision} — "${f.quote.text}" at ${formatClock(f.quote.start)}. ${f.explanation}`) : ["None"]), "");
  L.push("12. PERSONAL COACHING PLAN", ...doc.extras.coaching_priorities.map((c, i) => `${i + 1}. ${c.issue}\n   Action: ${c.action}\n   Better behaviour: "${c.example}"`), "");
  L.push("13. FINAL COACHING NOTE", doc.extras.final_coaching_note, "");
  L.push("14. HUMAN REVIEW", `Status: ${doc.human_review.status}`, ...doc.extras.needs_human_verification.map((v) => `Verify: ${v}`), ...doc.validation.warnings.map((w) => `Warning: ${w}`), `Criteria total: ${doc.validation.criteriaTotal}`);
  return L.join("\n");
}
