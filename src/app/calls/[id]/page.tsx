"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AlertOctagon, ArrowLeft, Clipboard, Download, FileText, SearchX } from "lucide-react";
import { ReportContext } from "@/components/report/ctx";
import { ReportNav } from "@/components/report/ReportNav";
import { S14Review } from "@/components/report/Section14";
import { S1CallDetails, S2Performance, S3Summary, S4Profile, S5Scorecard } from "@/components/report/Sections1to5";
import { S6Criteria, S7Psychology } from "@/components/report/Sections6to7";
import { S10Missed, S11Flags, S12Coaching, S13Note, S8Objections, S9Well } from "@/components/report/Sections8to13";
import { TranscriptPanel } from "@/components/report/TranscriptPanel";
import { Badge, EvalStatusBadge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, QueryGate, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { downloadText } from "@/lib/csv";
import { reportToText } from "@/lib/reportText";
import { getCallById } from "@/services";

export default function CallReportPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => getCallById(id), [id]);
  const [hl, setHl] = useState<{ segments: number[]; nonce: number } | null>(null);
  const [drawer, setDrawer] = useState(false);
  const jump = useCallback((segments: number[]) => { setHl({ segments, nonce: Date.now() }); setDrawer(true); }, []);
  const ctx = useMemo(() => (data ? { record: data.record, salesperson: data.salesperson, actions: data.actions, jump } : null), [data, jump]);

  const copy = async () => {
    if (!data) return;
    try { await navigator.clipboard.writeText(reportToText(data.record, data.salesperson)); toast({ tone: "success", title: "Report copied as text" }); }
    catch { toast({ tone: "error", title: "Clipboard unavailable", description: "Use Download report instead." }); }
  };

  return (
    <>
      <Link href="/calls" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />Back to Call Explorer</Link>
      <QueryGate loading={loading} error={error} hasData={data !== undefined} onRetry={reload} skeleton={<Skeleton className="h-[600px]" />}>
        {data === null ? (
          <Card><EmptyState icon={<SearchX className="h-5 w-5" />} title="Call not found" description={`No call with Callyzer ID “${id}” exists in the mock dataset.`} action={<Link href="/calls" className="text-[13px] font-medium text-brand hover:underline">Open Call Explorer</Link>} /></Card>
        ) : data && ctx && (() => {
          const { record } = data; const { call, doc } = record;
          const full = call.status === "evaluated" && !!doc;
          return (
            <ReportContext.Provider value={ctx}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold">{call.id}</h1><EvalStatusBadge status={call.status} />{full && doc.extras.flags.length > 0 && <Badge tone="bad"><AlertOctagon className="h-3 w-3" />{doc.extras.flags.filter((f) => f.decision !== "dismissed").length} critical flag{doc.extras.flags.length > 1 ? "s" : ""}</Badge>}</div>
                {full && <div className="flex flex-wrap gap-2"><Button size="sm" onClick={copy}><Clipboard className="h-3.5 w-3.5" />Copy as text</Button>
                  <Button size="sm" onClick={() => { downloadText(`mrv1-report-${call.id}.txt`, reportToText(record, data.salesperson), "text/plain;charset=utf-8"); toast({ tone: "success", title: "Report downloaded" }); }}><Download className="h-3.5 w-3.5" />Download report</Button>
                  <Button size="sm" className="xl:hidden" onClick={() => setDrawer(true)}><FileText className="h-3.5 w-3.5" />Transcript</Button></div>}
              </div>
              {!full && (
                <div role="alert" className="mb-4 rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-[13px] text-warn"><strong>No normal sales-stage evaluation was generated.</strong> {call.heldReason ?? (call.status === "processing" ? "Evaluation is still processing." : "")}</div>
              )}
              <div className="grid items-start gap-5 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_400px]">
                <div className="lg:sticky lg:top-20"><ReportNav only={full ? undefined : [1, 14]} /></div>
                <div className="min-w-0 space-y-4">
                  <S1CallDetails heldOnly={!full} />
                  {full && doc && <><S2Performance doc={doc} /><S3Summary doc={doc} /><S4Profile doc={doc} /><S5Scorecard doc={doc} /><S6Criteria doc={doc} /><S7Psychology doc={doc} /><S8Objections doc={doc} /><S9Well doc={doc} /><S10Missed doc={doc} /><S11Flags doc={doc} /><S12Coaching doc={doc} /><S13Note doc={doc} /></>}
                  <S14Review heldOnly={!full} />
                </div>
                {full && <div className="hidden xl:sticky xl:top-20 xl:block xl:h-[calc(100dvh-8rem)]"><TranscriptPanel transcript={record.transcript} highlight={hl} speakerUncertain={!!doc?.transcript_quality.speakerUncertain} onClear={() => setHl(null)} /></div>}
              </div>
              {full && drawer && (
                <div className="fixed inset-0 z-[60] xl:hidden"><div className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} />
                  <div className="absolute inset-y-0 right-0 w-[min(440px,100vw)] p-2 animate-in"><TranscriptPanel transcript={record.transcript} highlight={hl} speakerUncertain={!!doc?.transcript_quality.speakerUncertain} onClear={() => setHl(null)} onClose={() => setDrawer(false)} /></div></div>
              )}
            </ReportContext.Provider>
          );
        })()}
      </QueryGate>
    </>
  );
}
