"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { OUTCOME_BY_ID } from "@/config/ui";
import type { Outcome } from "@/types";

export function OutcomeDonut({ data }: { data: { outcome: Outcome; count: number }[] }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[160px] w-[160px] shrink-0" role="img" aria-label="Call outcome distribution">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="outcome" innerRadius={52} outerRadius={76} paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((d) => <Cell key={d.outcome} fill={OUTCOME_BY_ID[d.outcome].color} />)}
            </Pie>
            <Tooltip formatter={(v, _n, item) => [`${v} calls`, OUTCOME_BY_ID[(item.payload as { outcome: Outcome }).outcome].label]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-2xl font-semibold">{total}</span><span className="text-2xs text-ink-muted">calls</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.outcome} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 text-ink-soft"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: OUTCOME_BY_ID[d.outcome].color }} />{OUTCOME_BY_ID[d.outcome].label}</span>
            <span className="tabular text-ink"><span className="font-semibold">{d.count}</span><span className="ml-1.5 text-ink-muted">{total ? Math.round((d.count / total) * 100) : 0}%</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
