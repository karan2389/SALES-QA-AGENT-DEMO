"use client";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Checkbox, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { CATEGORIES, MIN_SAMPLE_SIZE, RUBRIC_VERSION, SKILL_VERSION } from "@/config/rubric";
import { MOCK_NOW_ISO, SCORE_BANDS } from "@/config/ui";
import { useDataset } from "@/hooks/useDataset";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useStoreVersion } from "@/hooks/useStoreVersion";
import { formatDateTime } from "@/lib/dates";
import { getPrototypeSettings, resetMockState, setPrototypeSettings } from "@/services";

export default function SettingsPage() {
  const toast = useToast();
  useStoreVersion();
  const { data } = useDataset();
  const proto = getPrototypeSettings();
  const [collapsed, setCollapsed] = usePersistentState("ffci:sidebar-collapsed", false);
  const [pageSize, setPageSize] = usePersistentState("ffci:calls-page-size", 10);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHeader title="Settings" description="Viewer preferences, prototype controls and the provisional configuration that drives scoring displays." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Preferences" description="Stored in this browser only" />
          <CardBody className="space-y-4">
            <Checkbox checked={collapsed} onChange={setCollapsed} label="Start with the sidebar collapsed (desktop)" />
            <label className="flex items-center justify-between gap-3 text-[13px] text-ink-soft">Default rows per page in Call Explorer
              <Select aria-label="Default rows per page" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="w-[90px]">{[10, 25, 50].map((n) => <option key={n}>{n}</option>)}</Select></label>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Prototype controls" description="Demonstrate loading and error states; reset local review changes" />
          <CardBody className="space-y-3">
            <Checkbox checked={proto.slow} onChange={(v) => setPrototypeSettings({ slow: v })} label="Simulate slow loading (≈1.6 s per request)" />
            <Checkbox checked={proto.error} onChange={(v) => setPrototypeSettings({ error: v })} label="Simulate API error on every request" />
            <Button size="sm" onClick={() => setConfirm(true)}><RotateCcw className="h-3.5 w-3.5" />Reset mock review state</Button>
            <dl className="grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs text-ink-muted">
              <dt>Mock “now”</dt><dd className="text-right text-ink">{formatDateTime(MOCK_NOW_ISO)}</dd>
              <dt>Calls / evaluations</dt><dd className="tabular text-right text-ink">{data?.calls.length ?? "—"} / {data?.evaluations.length ?? "—"}</dd>
              <dt>Transcripts / review records</dt><dd className="tabular text-right text-ink">{data?.transcripts.length ?? "—"} / {data?.reviews.length ?? "—"}</dd>
              <dt>Data source</dt><dd className="text-right text-ink">Local mock repository</dd>
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Score bands" description="Provisional presentation bands — edit in src/config/ui.ts" actions={<Badge tone="warn">Provisional</Badge>} />
          <table className="w-full text-[13px]"><thead className="border-y border-line bg-subtle/60 text-left text-xs font-medium text-ink-muted"><tr><th className="px-4 py-2">Band</th><th className="px-4 py-2">Range</th></tr></thead>
            <tbody className="divide-y divide-line">{SCORE_BANDS.map((b) => <tr key={b.id}><td className="px-4 py-2"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />{b.label}</td><td className="tabular px-4 py-2 text-ink-soft">{b.id === "poor" ? "Below 50" : `${b.min}–${b.max}`}</td></tr>)}</tbody></table>
          <p className="px-4 py-3 text-xs text-ink-muted">Minimum sample for reliable averages: {MIN_SAMPLE_SIZE} evaluated calls.</p>
        </Card>
        <Card>
          <CardHeader title="Evaluation rubric" description={`${RUBRIC_VERSION} · ${SKILL_VERSION} — edit in src/config/rubric.ts`} actions={<Badge tone="warn">Not approved</Badge>} />
          <div className="max-h-[320px] overflow-y-auto"><table className="w-full text-[13px]"><thead className="sticky top-0 border-y border-line bg-subtle text-left text-xs font-medium text-ink-muted"><tr><th className="px-4 py-2">Category</th><th className="px-4 py-2 text-right">Weight</th></tr></thead>
            <tbody className="divide-y divide-line">{CATEGORIES.map((c) => <tr key={c.id}><td className="px-4 py-2">{c.label}</td><td className="tabular px-4 py-2 text-right text-ink-soft">{c.weight}%</td></tr>)}</tbody></table></div>
        </Card>
      </div>
      <Dialog open={confirm} title="Reset mock review state?" description="Removes review actions, notes and score corrections saved in this browser. Seeded mock data is not affected." confirmLabel="Reset" confirmVariant="danger" onClose={() => setConfirm(false)}
        onConfirm={() => { resetMockState(); setConfirm(false); toast({ tone: "success", title: "Mock review state reset" }); }} />
    </>
  );
}
