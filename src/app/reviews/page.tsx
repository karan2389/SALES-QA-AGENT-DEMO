"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Avatar, Badge, EvalStatusBadge, GateBadge, ReviewChip } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Segmented, Select } from "@/components/ui/Form";
import { EmptyState, QueryGate, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { CALL_TYPES } from "@/config/mrv1";
import { useDataset } from "@/hooks/useDataset";
import { formatDate, formatTime } from "@/lib/dates";
import { QUEUES, queueItems, type QueueId } from "@/lib/reviewQueue";
import { updateManagerReview } from "@/services";
import type { CallType } from "@/types";

const TONE = { high: "bad", medium: "warn", low: "neutral" } as const;

export default function ReviewsPage() {
  const toast = useToast();
  const { rows, loading, error, reload, data } = useDataset();
  const [tab, setTab] = useState<QueueId>("pending");
  const [typeFor, setTypeFor] = useState<string | null>(null);
  const [type, setType] = useState<CallType>("new_webinar_prospect");
  const [busy, setBusy] = useState(false);
  const counts = useMemo(() => Object.fromEntries(QUEUES.map((q) => [q.id, queueItems(rows, q.id).length])) as Record<QueueId, number>, [rows]);
  const items = useMemo(() => queueItems(rows, tab), [rows, tab]);

  const run = async (callId: string, input: Parameters<typeof updateManagerReview>[0], ok: string) => {
    setBusy(true);
    try { await updateManagerReview(input); toast({ tone: "success", title: ok, description: "Saved in this browser only (mock)." }); setTypeFor(null); }
    catch (e) { toast({ tone: "error", title: "Not saved", description: e instanceof Error ? e.message : undefined }); } finally { setBusy(false); }
    void callId;
  };
  return (
    <>
      <PageHeader title="Human Review" description="Everything the engine produces needs a person: approve evaluations, decide critical flags, acknowledge transcript gates and confirm call types." />
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<Skeleton className="h-[420px]" />}>
        <Card>
          <div className="border-b border-line p-3"><Segmented ariaLabel="Review queues" value={tab} onChange={setTab} options={QUEUES.map((q) => ({ id: q.id, label: q.label, count: counts[q.id] }))} /></div>
          {items.length === 0 ? <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title={QUEUES.find((q) => q.id === tab)!.empty} description="Nothing in this queue needs attention right now." /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-[13px]">
              <thead className="border-y border-line bg-subtle/60 text-left text-xs font-medium text-ink-muted"><tr>{["Callyzer ID", "Salesperson", "Date", "Reason", "Status", "Priority", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-2">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{items.map(({ row: r, reason, priority }) => (
                <tr key={r.call.id} className="hover:bg-subtle/50">
                  <td className="px-4 py-3"><Link href={`/calls/${r.call.id}`} className="font-medium text-brand hover:underline">{r.call.id}</Link></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-2"><Avatar name={r.salesperson.name} color={r.salesperson.avatar} size={24} />{r.salesperson.name}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(r.call.callDate)} <span className="text-ink-muted">{formatTime(r.call.callDate)}</span></td>
                  <td className="max-w-[320px] px-4 py-3 text-ink-soft">{reason}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><EvalStatusBadge status={r.call.status} /><GateBadge status={r.gate} />{r.review && <ReviewChip status={r.review} />}</div></td>
                  <td className="px-4 py-3"><Badge tone={TONE[priority]} className="capitalize">{priority}</Badge></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2">
                    {tab === "type" && <Button size="sm" variant="primary" onClick={() => setTypeFor(r.call.id)}>Confirm call type</Button>}
                    {tab === "ack" && <Button size="sm" variant="primary" disabled={busy} onClick={() => run(r.call.id, { callId: r.call.id, kind: "ack_gate" }, "Transcript gate acknowledged")}>Acknowledge</Button>}
                    <Link href={`/calls/${r.call.id}`}><Button size="sm">Open</Button></Link></div></td>
                </tr>))}</tbody></table></div>
          )}
        </Card>
        <p className="mt-3 text-xs text-ink-muted">A call can appear in several queues. Priority: high = open critical flag, failed or disputed; medium = awaiting a human action. Approved evaluations leave the “pending” queue.</p>
      </QueryGate>
      <Dialog open={!!typeFor} title="Confirm call type" confirmLabel="Confirm call type" loading={busy} onClose={() => setTypeFor(null)} onConfirm={() => typeFor && run(typeFor, { callId: typeFor, kind: "confirm_call_type", callType: type }, "Call type confirmed")} description={`Choose the call type for ${typeFor}. An evaluation is only valid once a human confirms it. Continuation calls treat C01 and C02 as N/A.`}>
        <Select aria-label="Call type" value={type} onChange={(e) => setType(e.target.value as CallType)}>{CALL_TYPES.map((c) => <option key={c.id} value={c.id}>{c.label}{c.note ? ` — ${c.note}` : ""}</option>)}</Select>
      </Dialog>
    </>
  );
}
