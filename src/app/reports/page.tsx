"use client";
import { useMemo } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { QueryGate, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useDataset } from "@/hooks/useDataset";
import { useDateRange } from "@/hooks/useDateRange";
import { callsToCsv, criteriaToCsv, downloadCsv, flagsToCsv, reviewLogToCsv, stamp, toCsv } from "@/lib/csv";
import { formatRange } from "@/lib/dates";
import { evaluatedRows, inRangeRows, summarisePeople } from "@/lib/metrics";

export default function ReportsPage() {
  const toast = useToast();
  const { rows, salespeople, data, loading, error, reload } = useDataset();
  const { range, setRange } = useDateRange();
  const inR = useMemo(() => inRangeRows(rows, range), [rows, range]);
  const ev = evaluatedRows(inR);
  const reports = [
    { title: "Call evaluations", desc: "One row per call, mirroring the Google Sheet: Call ID · Date · Agent · Call type · Overall (sales-stage, provisional) · Transcript (timestamped) · Feedback (psychology score, category scores, flags) · Status · Review.", count: `${inR.length} calls`, file: "call-evaluations", csv: () => callsToCsv(inR) },
    { title: "Criterion-level", desc: "One row per criterion (70 sales-stage + 22 psychology per call) with outcome, reason code, evidence, explanation and improvement.", count: `${ev.length * 92} rows`, file: "criterion-level", csv: () => criteriaToCsv(inR) },
    { title: "Flags log", desc: "Every critical flag with severity, interpretation, verification, quote, timestamp and human decision.", count: `${ev.reduce((a, r) => a + r.doc!.extras.flags.length, 0)} flags`, file: "flags-log", csv: () => flagsToCsv(inR) },
    { title: "Salesperson summary", desc: "Calls evaluated (n), average sales-stage and psychology %, flags and NE rate per salesperson. Not a ranking.", count: `${salespeople.length} salespeople`, file: "salesperson-summary", csv: () => toCsv(["Salesperson", "Role", "Calls", "Calls evaluated (n)", "Avg sales-stage % (provisional)", "Avg psychology %", "Flags", "NE rate", "Low sample", "Note"], summarisePeople(inR, salespeople).map((p) => [p.salesperson.name, p.salesperson.role, p.calls, p.evaluated, p.stage?.toFixed(1), p.psych?.toFixed(1), p.flags, p.neRate === null ? "" : (p.neRate * 100).toFixed(1) + "%", p.lowSample ? "yes" : "no", "Illustrative mock data"])) },
    { title: "Review log", desc: "Every human action: approvals, disputes, flag decisions, corrections, call-type confirmations and gate acknowledgements, including those saved in this browser.", count: `${data?.actions.length ?? 0} actions`, file: "review-log", csv: () => reviewLogToCsv(data!) },
  ];
  return (
    <>
      <PageHeader title="Reports" description={<>CSV extracts of the current mock dataset. Call-based reports follow the selected date range: {formatRange(range)}.</>} actions={<DateRangePicker value={range} onChange={setRange} />} />
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<Skeleton className="h-[260px]" />}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((r) => (
            <Card key={r.title}><CardBody className="flex h-full flex-col pt-4">
              <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand"><FileSpreadsheet className="h-[18px] w-[18px]" /></span><Badge>{r.count}</Badge></div>
              <h2 className="mt-3 text-[15px] font-semibold">{r.title}</h2><p className="mt-1 flex-1 text-[13px] text-ink-muted">{r.desc}</p>
              <Button className="mt-4 justify-center" variant="primary" onClick={() => { downloadCsv(`flexifunnels-${r.file}-${stamp()}.csv`, r.csv()); toast({ tone: "success", title: `${r.title} exported`, description: "CSV downloaded (illustrative mock data)." }); }}><Download className="h-4 w-4" />Download CSV</Button>
            </CardBody></Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-muted">Exports contain illustrative mock data only. PDF and scheduled reports are not part of this prototype.</p>
      </QueryGate>
    </>
  );
}
