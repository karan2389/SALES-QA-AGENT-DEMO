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
import { callRowsToCsv, downloadCsv, stamp, toCsv } from "@/lib/csv";
import { formatDateTime, formatRange } from "@/lib/dates";
import { inRangeRows, teamTable } from "@/lib/metrics";
import { CATEGORY_BY_ID } from "@/config/rubric";

export default function ReportsPage() {
  const toast = useToast();
  const { rows, salespeople, data, loading, error, reload } = useDataset();
  const { range, setRange } = useDateRange();
  const inRange = useMemo(() => inRangeRows(rows, range), [rows, range]);
  const reviews = data?.reviews ?? [];

  const reports = [
    { title: "Call evaluations", desc: "One row per call with outcome, overall, discovery, objection and closing scores plus all 12 category scores.", count: `${inRange.length} calls`,
      run: () => downloadCsv(`flexifunnels-call-evaluations-${stamp()}.csv`, callRowsToCsv(inRange)) },
    { title: "Salesperson summary", desc: "Calls evaluated, average scores (with sample size), converted calls and improvement trend per salesperson.", count: `${salespeople.length} salespeople`,
      run: () => {
        const t = teamTable(rows, salespeople, range);
        downloadCsv(`flexifunnels-salesperson-summary-${stamp()}.csv`, toCsv(["Salesperson", "Role", "Calls in range", "Calls evaluated (n)", "Avg quality", "Discovery", "Objection handling", "Closing", "Converted calls", "Trend (pts)", "Low sample", "Note"],
          t.map((r) => [r.salesperson.name, r.salesperson.role, r.calls, r.evaluated, r.avgScore?.toFixed(1), r.discovery?.toFixed(1), r.objection?.toFixed(1), r.closing?.toFixed(1), r.converted, r.trend?.toFixed(1), r.lowSample ? "yes" : "no", "Illustrative mock data"])));
      } },
    { title: "Manager review log", desc: "Every review action, note and score correction, including those saved in this browser.", count: `${reviews.length} entries`,
      run: () => downloadCsv(`flexifunnels-review-log-${stamp()}.csv`, toCsv(["Review ID", "Call ID", "Reviewer", "Action", "Notes", "Score correction", "Reviewed at"],
        reviews.map((r) => [r.id, r.callId, r.reviewer, r.status.replace("_", " "), r.notes, r.correction ? `${CATEGORY_BY_ID[r.correction.category].label}: ${r.correction.from} -> ${r.correction.to}` : "", formatDateTime(r.reviewedAt)]))) },
  ];

  return (
    <>
      <PageHeader title="Reports" description={<>Download CSV extracts of the current mock dataset. Call and salesperson reports follow the selected date range: {formatRange(range)}.</>}
        actions={<DateRangePicker value={range} onChange={setRange} />} />
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<Skeleton className="h-[260px]" />}>
        <div className="grid gap-4 md:grid-cols-3">
          {reports.map((r) => (
            <Card key={r.title}><CardBody className="flex h-full flex-col pt-4">
              <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand"><FileSpreadsheet className="h-[18px] w-[18px]" /></span><Badge>{r.count}</Badge></div>
              <h2 className="mt-3 text-[15px] font-semibold">{r.title}</h2>
              <p className="mt-1 flex-1 text-[13px] text-ink-muted">{r.desc}</p>
              <Button className="mt-4 justify-center" variant="primary" onClick={() => { r.run(); toast({ tone: "success", title: `${r.title} exported`, description: "CSV downloaded (illustrative mock data)." }); }}><Download className="h-4 w-4" />Download CSV</Button>
            </CardBody></Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-muted">Exports contain illustrative mock data only. Scheduled and PDF reports are not part of this prototype.</p>
      </QueryGate>
    </>
  );
}
