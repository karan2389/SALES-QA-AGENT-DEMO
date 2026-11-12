"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ScoreBar } from "@/components/charts/ScoreIndicators";
import { Avatar, Badge, InfoTip } from "@/components/ui/Badges";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { TrendDelta } from "@/components/ui/TrendDelta";
import { MIN_SAMPLE_SIZE } from "@/config/rubric";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

type SortKey = "score" | "volume";

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const [key, setKey] = useState<SortKey>("score");
  const [dir, setDir] = useState<"desc" | "asc">("desc");
  const sorted = useMemo(() => {
    const active = entries.filter((e) => e.calls > 0);
    const val = (e: LeaderboardEntry) => (key === "score" ? e.avgScore ?? -1 : e.calls);
    const cmp = (a: LeaderboardEntry, b: LeaderboardEntry) => (dir === "desc" ? val(b) - val(a) : val(a) - val(b));
    // Low-sample people are never ranked among reliable ones.
    return [...active.filter((e) => !e.lowSample).sort(cmp), ...active.filter((e) => e.lowSample).sort(cmp)];
  }, [entries, key, dir]);

  const toggle = (k: SortKey) => { if (k === key) setDir((d) => (d === "desc" ? "asc" : "desc")); else { setKey(k); setDir("desc"); } };
  const Th = ({ k, children, className }: { k?: SortKey; children: React.ReactNode; className?: string }) => (
    <th scope="col" className={cn("px-4 py-2 text-xs font-medium text-ink-muted", className)} aria-sort={k && k === key ? (dir === "desc" ? "descending" : "ascending") : undefined}>
      {k ? (
        <button onClick={() => toggle(k)} className={cn("inline-flex items-center gap-1 hover:text-ink", k === key && "text-ink")}>
          {children}{k === key && (dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
        </button>
      ) : children}
    </th>
  );

  return (
    <Card className="h-full">
      <CardHeader title="Sales team leaderboard" description="Ordered by the selected metric. Converted calls are context, not a quality measure."
        actions={<InfoTip text={`Averages use evaluated calls only. People with fewer than ${MIN_SAMPLE_SIZE} evaluated calls are flagged "Low sample" and listed after the rest rather than ranked.`} />} />
      {sorted.length === 0 ? <EmptyState title="No evaluated calls in this range" /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead className="border-y border-line bg-subtle/60 text-left">
              <tr>
                <Th>Salesperson</Th>
                <Th k="volume" className="text-right">Calls evaluated</Th>
                <Th k="score">Avg quality</Th>
                <Th className="text-right">Converted</Th>
                <Th className="text-right">Trend</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((e) => (
                <tr key={e.salesperson.id} className="hover:bg-subtle/50">
                  <td className="px-4 py-2.5">
                    <Link href={`/team/${e.salesperson.id}`} className="flex items-center gap-2.5 font-medium text-ink hover:text-brand">
                      <Avatar name={e.salesperson.name} color={e.salesperson.avatar} size={26} />{e.salesperson.name}
                    </Link>
                  </td>
                  <td className="tabular px-4 py-2.5 text-right">{e.calls}</td>
                  <td className="px-4 py-2.5"><div className="flex items-center gap-2"><ScoreBar score={e.avgScore} />{e.lowSample && <Badge tone="warn">Low sample</Badge>}</div></td>
                  <td className="tabular px-4 py-2.5 text-right text-ink-soft">{e.converted}</td>
                  <td className="px-4 py-2.5 text-right"><TrendDelta value={e.trend} unit=" pts" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
