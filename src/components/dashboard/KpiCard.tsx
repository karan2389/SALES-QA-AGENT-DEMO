import type { ReactNode } from "react";
import { InfoTip } from "@/components/ui/Badges";
import { Card } from "@/components/ui/Card";
import { TrendDelta } from "@/components/ui/TrendDelta";
import type { Kpi } from "@/lib/metrics";

export function KpiCard({ label, tooltip, kpi, value, format = (n) => String(Math.round(n)), unit = "", digits = 0, goodWhen, footnote, accent }: {
  label: string; tooltip: string; kpi: Kpi; value?: ReactNode; format?: (n: number) => string; unit?: string; digits?: number; goodWhen?: "up" | "down"; footnote?: ReactNode; accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-ink-muted">{label}</p><InfoTip text={tooltip} /></div>
      <p className="tabular mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink">{value ?? (kpi.value === null ? "—" : format(kpi.value))}{accent && kpi.value ? <span className="sr-only"> needs attention</span> : null}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-muted">
        {kpi.delta === null ? <span>No prior period to compare</span> : <><TrendDelta value={kpi.delta} unit={unit} digits={digits} goodWhen={goodWhen ?? "up"} neutral={!goodWhen} threshold={digits === 0 ? 0.5 : 0.05} /><span>vs prev. ({kpi.previous === null ? "—" : format(kpi.previous)})</span></>}
      </div>
      {footnote && <p className="mt-1 text-2xs text-ink-muted">{footnote}</p>}
    </Card>
  );
}
