"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Checkbox, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { CALL_TYPES, CATEGORIES, FLAGS, GATE, MIN_SAMPLE, RUBRIC_VERSION, SCALE, SP_CRITERIA, TERMS } from "@/config/mrv1";
import { MOCK_NOW_ISO } from "@/config/ui";
import { useDataset } from "@/hooks/useDataset";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useStoreVersion } from "@/hooks/useStoreVersion";
import { formatDateTime } from "@/lib/dates";
import { getPrototypeSettings, resetMockState, setPrototypeSettings } from "@/services";

const Approved = () => <Badge tone="good">Approved</Badge>;
const Pending = ({ children = "Pending approval" }: { children?: string }) => <Badge tone="warn">{children}</Badge>;

export default function SettingsPage() {
  const toast = useToast();
  useStoreVersion();
  const { data } = useDataset();
  const proto = getPrototypeSettings();
  const [collapsed, setCollapsed] = usePersistentState("ffci2:sidebar-collapsed", false);
  const [pageSize, setPageSize] = usePersistentState("ffci2:calls-page-size", 10);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHeader title="Settings" description="Preferences, prototype controls and a read-only view of the rubric the engine uses." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader title="Preferences" description="Stored in this browser only" />
          <CardBody className="space-y-4"><Checkbox checked={collapsed} onChange={setCollapsed} label="Start with the sidebar collapsed (desktop)" />
            <label className="flex items-center justify-between gap-3 text-[13px] text-ink-soft">Default rows per page in Call Explorer<Select aria-label="Default rows per page" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="w-[90px]">{[10, 25, 50].map((n) => <option key={n}>{n}</option>)}</Select></label></CardBody></Card>
        <Card><CardHeader title="Prototype controls" description="Demonstrate loading and error states; reset local review actions" />
          <CardBody className="space-y-3"><Checkbox checked={proto.slow} onChange={(v) => setPrototypeSettings({ slow: v })} label="Simulate slow loading (≈1.6 s per request)" /><Checkbox checked={proto.error} onChange={(v) => setPrototypeSettings({ error: v })} label="Simulate API error on every request" />
            <Button size="sm" onClick={() => setConfirm(true)}><RotateCcw className="h-3.5 w-3.5" />Reset mock review state</Button>
            <dl className="grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs text-ink-muted"><dt>Mock “now”</dt><dd className="text-right text-ink">{formatDateTime(MOCK_NOW_ISO)}</dd><dt>Calls</dt><dd className="tabular text-right text-ink">{data?.records.length ?? "—"}</dd><dt>Human review actions</dt><dd className="tabular text-right text-ink">{data?.actions.length ?? "—"}</dd><dt>Data source</dt><dd className="text-right text-ink">Local mock repository</dd></dl></CardBody></Card>

        <Card className="lg:col-span-2"><CardHeader title={`Rubric ${RUBRIC_VERSION}`} description="Read-only. Mirrors the evaluation engine; nothing here can be edited in the product." actions={<Approved />} />
          <CardBody className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div><h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Scoring</h3>
                <ul className="space-y-1.5 text-[13px] text-ink-soft"><li>{TERMS.formula}</li><li>Sales-stage score = average of the applicable category percentages (C01–C19, counted equally; N/A categories excluded).</li><li>Sales Psychology & Conduct is a separate scorecard (SP-01…SP-22) and is never combined.</li><li>A score is provisional when at least one criterion is Not Evaluable; NE is never counted as zero.</li></ul></div>
              <div><h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Outcome scale</h3>
                <ul className="space-y-1 text-[13px]">{SCALE.map((s) => <li key={String(s.value)} className="flex gap-2"><span className="tabular w-8 font-semibold">{s.short}</span><span className="text-ink-soft"><strong className="font-medium text-ink">{s.label}.</strong> {s.help}</span></li>)}</ul></div>
            </div>
            <div><h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Categories <span className="font-normal normal-case">(19 categories · {CATEGORIES.reduce((a, c) => a + c.criteria.length, 0)} criteria, plus {SP_CRITERIA.length} SP criteria)</span></h3>
              <div className="grid gap-x-8 gap-y-1 text-[13px] sm:grid-cols-2">{CATEGORIES.map((c) => <div key={c.id} className="flex justify-between border-b border-line/60 py-1"><span><span className="tabular mr-1.5 text-xs text-ink-muted">{c.id}</span>{c.name}</span><span className="tabular text-ink-muted">{c.criteria.length} criteria · stages {c.group}</span></div>)}</div></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Critical flags & score caps <Approved /></h3>
                <ul className="space-y-1 text-[13px]">{FLAGS.map((f) => <li key={f.id} className="flex justify-between gap-2"><code className="text-2xs">{f.id}</code><span className="text-ink-muted">{f.caps.length ? f.caps.map((c) => `${c.criterion} ≤ ${c.cap}`).join(", ") : "no cap"}</span></li>)}</ul></div>
              <div className="space-y-4">
                <div><h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Call types</h3><ul className="space-y-1 text-[13px]">{CALL_TYPES.map((c) => <li key={c.id}><code className="text-2xs">{c.id}</code>{c.note && <span className="ml-2 text-ink-muted">{c.note}</span>}</li>)}</ul></div>
                <div><h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Gate thresholds <Approved /></h3>
                  <ul className="space-y-1 text-[13px] text-ink-soft"><li>Recording: audio length ≥ {GATE.recordingMinRatio * 100}% of the logged call duration.</li><li>Transcript decisions: {GATE.transcript.map((g) => g.id).join(", ")} (requires_human_review proceeds only after a human acknowledges it).</li><li>Call type must be confirmed by a human.</li></ul></div>
                <div><h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Pending approval</h3>
                  <ul className="space-y-1 text-[13px] text-ink-soft"><li className="flex items-center justify-between">Score bands (e.g. Good / Excellent)<Pending>Not approved — not used</Pending></li><li className="flex items-center justify-between">Approved Objection Doc<Pending>Not yet available</Pending></li><li className="flex items-center justify-between">Minimum sample for averages ({MIN_SAMPLE} calls)<Pending>Prototype default</Pending></li></ul></div>
              </div>
            </div>
          </CardBody></Card>
      </div>
      <Dialog open={confirm} title="Reset mock review state?" description="Removes human review actions saved in this browser. Seeded mock data is not affected." confirmLabel="Reset" confirmVariant="danger" onClose={() => setConfirm(false)} onConfirm={() => { resetMockState(); setConfirm(false); toast({ tone: "success", title: "Mock review state reset" }); }} />
    </>
  );
}
