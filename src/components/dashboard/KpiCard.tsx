import { Sparkline } from "@/components/charts/Sparkline";
import { InfoTip } from "@/components/ui/Badges";
import { Card } from "@/components/ui/Card";
import { TrendDelta } from "@/components/ui/TrendDelta";
import type { KpiValue } from "@/types";

interface Props {
  label: string;
  tooltip: string;
  kpi: KpiValue;
  format: (n: number) => string;
  deltaUnit?: string;
  deltaDigits?: number;
  goodWhen?: "up" | "down";
  footnote?: string;
}

export function KpiCard({ label, tooltip, kpi, format, deltaUnit = "", deltaDigits = 1, goodWhen = "up", footnote }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <InfoTip text={tooltip} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="tabular text-[28px] font-semibold leading-none tracking-tight text-ink">{format(kpi.value)}</p>
        <Sparkline values={kpi.sparkline} color={goodWhen === "down" ? "#d58a0b" : "#2563eb"} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-muted [&>*]:whitespace-nowrap">
        {kpi.delta === null ? <span>No prior period to compare</span> : (
          <>
            <TrendDelta value={kpi.delta} unit={deltaUnit} digits={deltaDigits} goodWhen={goodWhen} threshold={deltaDigits === 0 ? 0.5 : 0.05} />
            <span>vs prev. ({format(kpi.previous ?? 0)})</span>
          </>
        )}
      </div>
      {footnote && <p className="mt-1 text-2xs text-ink-muted">{footnote}</p>}
    </Card>
  );
}
