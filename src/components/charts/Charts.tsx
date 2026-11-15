"use client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/types";
import { AXIS, GRID } from "./palette";

export const STAGE_COLOR = "#1d4ed8";
export const PSYCH_COLOR = "#0f8b8d";

/** Two separate lines — sales-stage score and Sales Psychology & Conduct score. Never combined. */
export function ScoreTrendChart({ data, xLabel, height = 260 }: { data: TrendPoint[]; xLabel: string; height?: number }) {
  const dense = data.length > 14;
  return (
    <div style={{ height }} role="img" aria-label="Sales-stage and psychology score trend">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, bottom: 18, left: 6 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval={dense ? "preserveStartEnd" : 0} minTickGap={dense ? 28 : 8} label={{ value: xLabel, position: "insideBottom", offset: -12, fontSize: 11, fill: AXIS }} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={40} unit="%" />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as TrendPoint;
            return (
              <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-pop">
                <p className="font-medium">{p.label}</p>
                <p className="mt-0.5" style={{ color: STAGE_COLOR }}>Sales-stage: <span className="tabular font-semibold">{p.stage === null ? "—" : `${p.stage}%`}</span></p>
                <p style={{ color: PSYCH_COLOR }}>Psychology: <span className="tabular font-semibold">{p.psych === null ? "—" : `${p.psych}%`}</span></p>
                <p className="text-ink-muted">{p.count} evaluated call{p.count === 1 ? "" : "s"} · provisional scores</p>
              </div>
            );
          }} />
          <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 12 }} />
          <Line name="Sales-stage score" type="monotone" dataKey="stage" stroke={STAGE_COLOR} strokeWidth={2} connectNulls dot={{ r: dense ? 2 : 3.5, strokeWidth: 0, fill: STAGE_COLOR }} isAnimationActive={false} />
          <Line name="Sales Psychology & Conduct score" type="monotone" dataKey="psych" stroke={PSYCH_COLOR} strokeWidth={2} strokeDasharray="5 3" connectNulls dot={{ r: dense ? 2 : 3.5, strokeWidth: 0, fill: PSYCH_COLOR }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface Slice { label: string; value: number; color: string }
export function DonutChart({ data, centerLabel }: { data: Slice[]; centerLabel: string }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[150px] w-[150px] shrink-0" role="img" aria-label={`${centerLabel} distribution`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={data.filter((d) => d.value > 0)} dataKey="value" nameKey="label" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="none" isAnimationActive={false}>{data.filter((d) => d.value > 0).map((d) => <Cell key={d.label} fill={d.color} />)}</Pie><Tooltip /></PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="tabular text-2xl font-semibold">{total}</span><span className="text-2xs text-ink-muted">{centerLabel}</span></div>
      </div>
      <ul className="w-full space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 text-ink-soft"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: d.color }} />{d.label}</span>
            <span className="tabular"><span className="font-semibold">{d.value}</span><span className="ml-1.5 text-ink-muted">{total ? Math.round((d.value / total) * 100) : 0}%</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Histogram({ data }: { data: { bucket: string; count: number }[] }) {
  return (
    <div className="h-[200px]" role="img" aria-label="Histogram of sales-stage scores in 10-point buckets">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 16, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="bucket" tickFormatter={(b: string) => b.split("–")[0]} tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval={0} label={{ value: "Sales-stage score (% — start of 10-point bucket)", position: "insideBottom", offset: -10, fontSize: 11, fill: AXIS }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={28} />
          <Tooltip cursor={{ fill: "rgb(15 23 42 / 0.04)" }} labelFormatter={(l) => `Score ${l}%`} formatter={(v) => [`${v} calls`, "Count"]} />
          <Bar dataKey="count" fill={STAGE_COLOR} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
