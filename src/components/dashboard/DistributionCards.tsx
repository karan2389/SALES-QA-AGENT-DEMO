import { HorizontalBars } from "@/components/charts/HorizontalBars";
import { OutcomeDonut } from "@/components/charts/OutcomeDonut";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { InfoTip } from "@/components/ui/Badges";
import { SCORE_BANDS } from "@/config/ui";
import type { Outcome } from "@/types";

export function OutcomeCard({ data }: { data: { outcome: Outcome; count: number }[] }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <Card className="h-full">
      <CardHeader title="Call outcome" description="Business result of each call — independent of quality" actions={<InfoTip text="Outcome comes from the CRM / call record. A converted call can still have weak selling quality, and an unsuccessful call can be well handled." />} />
      <CardBody>{total ? <OutcomeDonut data={data} /> : <EmptyState title="No calls in this range" />}</CardBody>
    </Card>
  );
}

export function QualityBandsCard({ bands }: { bands: { id: string; count: number }[] }) {
  const total = bands.reduce((a, b) => a + b.count, 0);
  const max = Math.max(1, ...bands.map((b) => b.count));
  return (
    <Card className="h-full">
      <CardHeader title="Quality distribution" description="Evaluated calls by score band"
        actions={<InfoTip text="Provisional presentation bands from the central config — not approved scoring rules." />} />
      <CardBody>
        {total ? (
          <HorizontalBars labelWidth={130} max={max} rows={SCORE_BANDS.map((b) => {
            const count = bands.find((x) => x.id === b.id)?.count ?? 0;
            return { id: b.id, label: <span title={`${b.min}–${b.max}`}>{b.label}</span>, value: count, display: String(count), sub: `${Math.round((count / total) * 100)}%`, color: b.color };
          })} />
        ) : <EmptyState title="No evaluated calls in this range" />}
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-2xs text-ink-muted">
          {SCORE_BANDS.map((b) => <li key={b.id}><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: b.color }} />{b.label}: {b.id === "poor" ? `below ${SCORE_BANDS[2].min}` : `${b.min}–${b.max}`}</li>)}
        </ul>
      </CardBody>
    </Card>
  );
}
