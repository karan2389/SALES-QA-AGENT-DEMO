import { SEVERITY_ORDER } from "@/config/ui";
import type { CallRecord, Dataset, GateStatus, Row, Severity } from "@/types";

const worst = (...s: GateStatus[]): GateStatus => (s.includes("blocked") ? "blocked" : s.includes("review") ? "review" : "pass");

export function toRow(rec: CallRecord, salesperson: Row["salesperson"]): Row {
  const { call, doc } = rec;
  const evaluated = call.status === "evaluated" && doc;
  const flags = evaluated ? doc.extras.flags.filter((f) => f.decision !== "dismissed") : [];
  const top = flags.reduce<Severity | null>((m, f) => (m === null || SEVERITY_ORDER[f.severity] > SEVERITY_ORDER[m] ? f.severity : m), null);
  const c18 = evaluated ? doc.scores.categories.find((c) => c.id === "C18")!.pct : null;
  return {
    rec, call, salesperson, doc: evaluated ? doc : null, ts: new Date(call.callDate).getTime(),
    stage: evaluated ? doc.scores.stage.pct : null, psych: evaluated ? doc.scores.psychology.pct : null,
    provisional: evaluated ? doc.scores.stage.provisional : false,
    flagCount: flags.length, openFlags: flags.filter((f) => f.decision === "pending").length, topSeverity: top,
    gate: worst(call.gates.recording.status, call.gates.transcript.status, call.gates.callType.status),
    review: evaluated ? doc.human_review.status : null, c18,
  };
}

export function buildRows(ds: Dataset): Row[] {
  const sp = new Map(ds.salespeople.map((s) => [s.id, s]));
  return ds.records.map((r) => toRow(r, sp.get(r.call.salespersonId)!)).sort((a, b) => b.ts - a.ts);
}
