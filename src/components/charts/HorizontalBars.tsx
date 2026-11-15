import type { ReactNode } from "react";

export interface BarRow { id: string; label: ReactNode; value: number; display: string; color: string; sub?: string }
export function HorizontalBars({ rows, max = 100, labelWidth = 150 }: { rows: BarRow[]; max?: number; labelWidth?: number }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3">
          <span className="shrink-0 truncate text-[13px] text-ink-soft" style={{ width: labelWidth }}>{r.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-subtle" role="meter" aria-valuenow={r.value} aria-valuemin={0} aria-valuemax={max} aria-label={typeof r.label === "string" ? r.label : undefined}>
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, (r.value / max) * 100)}%`, background: r.color }} />
          </div>
          <span className="tabular w-[78px] shrink-0 text-right text-[13px] font-semibold text-ink">{r.display}{r.sub && <span className="ml-1 font-normal text-ink-muted">{r.sub}</span>}</span>
        </li>
      ))}
    </ul>
  );
}
