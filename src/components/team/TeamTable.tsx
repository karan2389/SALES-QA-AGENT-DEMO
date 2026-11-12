"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { ScoreBar } from "@/components/charts/ScoreIndicators";
import { Avatar, Badge } from "@/components/ui/Badges";
import { TrendDelta } from "@/components/ui/TrendDelta";
import { cn } from "@/lib/utils";
import type { TeamTableRow } from "@/lib/metrics";

type Key = "name" | "evaluated" | "avgScore" | "discovery" | "objection" | "closing" | "converted" | "trend";
const COLS: { key: Key; label: string; align?: "right" }[] = [
  { key: "name", label: "Salesperson" }, { key: "evaluated", label: "Calls evaluated", align: "right" }, { key: "avgScore", label: "Avg quality" },
  { key: "discovery", label: "Discovery" }, { key: "objection", label: "Objection handling" }, { key: "closing", label: "Closing" },
  { key: "converted", label: "Converted calls", align: "right" }, { key: "trend", label: "Improvement trend", align: "right" },
];

export function TeamTable({ rows }: { rows: TeamTableRow[] }) {
  const [key, setKey] = useState<Key>("name");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const sorted = useMemo(() => {
    const val = (r: TeamTableRow): number | string | null => key === "name" ? r.salesperson.name : (r[key] as number | null);
    const cmp = (a: TeamTableRow, b: TeamTableRow) => {
      const x = val(a), y = val(b);
      if (x === null && y === null) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      const c = typeof x === "string" ? x.localeCompare(y as string) : x - (y as number);
      return dir === "asc" ? c : -c;
    };
    if (key === "name") return [...rows].sort(cmp);
    // Metric sorts never rank low-sample people alongside reliable samples.
    return [...rows.filter((r) => !r.lowSample).sort(cmp), ...rows.filter((r) => r.lowSample).sort(cmp)];
  }, [rows, key, dir]);
  const onSort = (k: Key) => { if (k === key) setDir((d) => (d === "asc" ? "desc" : "asc")); else { setKey(k); setDir(k === "name" ? "asc" : "desc"); } };
  const n = (r: TeamTableRow) => <span className="ml-1.5 text-xs font-normal text-ink-muted">n={r.evaluated}</span>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-[13px]">
        <thead className="border-y border-line bg-subtle/60 text-left">
          <tr>
            {COLS.map((c) => (
              <th key={c.key} scope="col" aria-sort={c.key === key ? (dir === "asc" ? "ascending" : "descending") : undefined} className={cn("whitespace-nowrap px-4 py-2 text-xs font-medium text-ink-muted", c.align === "right" && "text-right")}>
                <button onClick={() => onSort(c.key)} className={cn("inline-flex items-center gap-1 hover:text-ink", c.key === key && "text-ink")}>
                  {c.label}{c.key === key ? (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((r) => (
            <tr key={r.salesperson.id} className="hover:bg-subtle/50">
              <td className="px-4 py-3">
                <Link href={`/team/${r.salesperson.id}`} className="flex items-center gap-2.5 hover:text-brand">
                  <Avatar name={r.salesperson.name} color={r.salesperson.avatar} size={30} />
                  <span><span className="block font-medium text-ink">{r.salesperson.name}</span><span className="block text-xs text-ink-muted">{r.salesperson.role}</span></span>
                </Link>
              </td>
              <td className="tabular px-4 py-3 text-right">{r.evaluated}{r.lowSample && <Badge tone="warn" className="ml-2">Low sample</Badge>}</td>
              <td className="px-4 py-3">{r.avgScore === null ? <span className="text-ink-muted">—</span> : <div className="flex items-center"><ScoreBar score={r.avgScore} />{n(r)}</div>}</td>
              <td className="px-4 py-3">{r.discovery === null ? <span className="text-ink-muted">—</span> : <><span className="tabular font-medium">{Math.round(r.discovery)}</span>{n(r)}</>}</td>
              <td className="px-4 py-3">{r.objection === null ? <span className="text-ink-muted">—</span> : <><span className="tabular font-medium">{Math.round(r.objection)}</span>{n(r)}</>}</td>
              <td className="px-4 py-3">{r.closing === null ? <span className="text-ink-muted">—</span> : <><span className="tabular font-medium">{Math.round(r.closing)}</span>{n(r)}</>}</td>
              <td className="tabular px-4 py-3 text-right text-ink-soft">{r.converted}<span className="ml-1 text-xs text-ink-muted">of {r.calls}</span></td>
              <td className="px-4 py-3 text-right"><TrendDelta value={r.trend} unit=" pts" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
