"use client";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, GRID, SERIES } from "./palette";

export interface ComparisonSeries { key: string; name: string }

export function GroupedBarChart({ data, series, height = 300 }: { data: Record<string, string | number | null>[]; series: ComparisonSeries[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Grouped comparison chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval={0} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={34} />
          <Tooltip cursor={{ fill: "rgb(15 23 42 / 0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.name} fill={SERIES[i % SERIES.length]} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiLineChart({ data, series, height = 300 }: { data: Record<string, string | number | null>[]; series: ComparisonSeries[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Category trend comparison chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={34} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={SERIES[i % SERIES.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
