import type { Row } from "@/types";

export type QueueId = "pending" | "flags" | "ack" | "type" | "failed" | "ne" | "disputed";
export const QUEUES: { id: QueueId; label: string; empty: string }[] = [
  { id: "pending", label: "Pending human review", empty: "No evaluations are waiting for review" },
  { id: "flags", label: "Open critical flags", empty: "No flags are waiting for a decision" },
  { id: "ack", label: "Gate acknowledgements", empty: "No transcripts need acknowledgement" },
  { id: "type", label: "Call type needs confirmation", empty: "All call types are confirmed" },
  { id: "failed", label: "Evaluation failed", empty: "No failed evaluations" },
  { id: "ne", label: "NE-heavy evaluations", empty: "No evaluations with many Not Evaluable criteria" },
  { id: "disputed", label: "Disputed", empty: "No disputed evaluations" },
];
export const NE_HEAVY_THRESHOLD = 5;

export interface QueueItem { row: Row; queue: QueueId; reason: string; priority: "high" | "medium" | "low" }

export function queueItems(rows: Row[], queue: QueueId): QueueItem[] {
  const out: QueueItem[] = [];
  for (const r of rows) {
    const { call, doc } = r;
    if (queue === "pending" && doc && r.review === "pending") out.push({ row: r, queue, reason: "Awaiting human approval", priority: r.openFlags ? "high" : "medium" });
    if (queue === "flags" && doc && r.openFlags) out.push({ row: r, queue, reason: `${r.openFlags} critical flag${r.openFlags > 1 ? "s" : ""} pending a human decision`, priority: "high" });
    if (queue === "ack" && call.gates.transcript.status === "review") out.push({ row: r, queue, reason: call.gates.transcript.reason, priority: "medium" });
    if (queue === "type" && call.gates.callType.status === "blocked") out.push({ row: r, queue, reason: "Held — call type needs confirmation", priority: "medium" });
    if (queue === "failed" && call.status === "failed") out.push({ row: r, queue, reason: call.heldReason ?? "Evaluation failed", priority: "high" });
    if (queue === "ne" && doc && doc.scores.stage.ne >= NE_HEAVY_THRESHOLD) out.push({ row: r, queue, reason: `${doc.scores.stage.ne} criteria Not Evaluable`, priority: "medium" });
    if (queue === "disputed" && r.review === "disputed") out.push({ row: r, queue, reason: "Evaluation disputed by a reviewer", priority: "high" });
  }
  const o = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => o[a.priority] - o[b.priority] || b.row.ts - a.row.ts);
}
