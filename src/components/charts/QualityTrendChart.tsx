"use client";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SCORE_BANDS } from "@/config/ui";
import type { TrendPoint } from "@/types";
import { AXIS, GRID } from "./palette";

interface Props { data: TrendPoint[]; xLabel: string; height?: number; color?: string; name?: string }

/** Average quality over time. Empty buckets produce gaps in data but keep the time axis continuous. */
export function QualityTrendChart({ data, xLabel, height = 260, color = "#2563eb", name = "Average quality score" }: Props) {
  const dense = data.length > 14;
  return (
    <div style={{ height }} role="img" aria-label={`${name} over time`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, bottom: 18, left: 6 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          {SCORE_BANDS.slice(0, 2).map((b) => <ReferenceLine key={b.id} y={b.min} stroke={b.color} strokeDasharray="3 4" strokeOpacity={0.45} />)}
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval={dense ? "preserveStartEnd" : 0}
            minTickGap={dense ? 28 : 8} label={{ value: xLabel, position: "insideBottom", offset: -12, fontSize: 11, fill: AXIS }} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 70, 85, 100]} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={40}
            label={{ value: "Avg score", angle: -90, position: "insideLeft", offset: 12, fontSize: 11, fill: AXIS }} />
          <Tooltip cursor={{ stroke: GRID }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as TrendPoint;
            return (
              <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-pop">
                <p className="font-medium text-ink">{p.label}</p>
                <p className="mt-0.5 text-ink-soft">{name}: <span className="font-semibold tabular">{p.avg === null ? "—" : p.avg}</span></p>
                <p className="text-ink-muted">{p.count} evaluated call{p.count === 1 ? "" : "s"}</p>
              </div>
            );
          }} />
          <Line type="monotone" dataKey="avg" stroke={color} strokeWidth={2} connectNulls dot={{ r: dense ? 2 : 3.5, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
