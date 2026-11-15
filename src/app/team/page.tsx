"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Avatar, Badge, FlagCount, InfoTip, ScoreBar } from "@/components/ui/Badges";
import { Card, PageHeader } from "@/components/ui/Card";
import { EmptyState, QueryGate, Skeleton } from "@/components/ui/States";
import { TrendDelta } from "@/components/ui/TrendDelta";
import { MIN_SAMPLE } from "@/config/mrv1";
import { useDataset } from "@/hooks/useDataset";
import { useDateRange } from "@/hooks/useDateRange";
import { formatRange } from "@/lib/dates";
import { inRangeRows, summarisePeople, trendClaim, type SalespersonSummary } from "@/lib/metrics";
import { cn } from "@/lib/utils";

type Key = "name" | "evaluated" | "stage" | "psych" | "flags" | "neRate";
const COLS: { k: Key; label: string; right?: boolean }[] = [{ k: "name", label: "Salesperson" }, { k: "evaluated", label: "Calls evaluated", right: true }, { k: "stage", label: "Avg sales-stage %" }, { k: "psych", label: "Avg psychology %" }, { k: "flags", label: "Flags" }, { k: "neRate", label: "NE rate", right: true }];

export default function TeamPage() {
  const { rows, salespeople, loading, error, reload, data } = useDataset();
  const { range } = useDateRange();
  const [key, setKey] = useState<Key>("name");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const inR = useMemo(() => inRangeRows(rows, range), [rows, range]);
  const people = useMemo(() => summarisePeople(inR, salespeople), [inR, salespeople]);
  const sorted = useMemo(() => {
    const v = (p: SalespersonSummary): number | string | null => key === "name" ? p.salesperson.name : key === "evaluated" ? p.evaluated : key === "stage" ? p.stage : key === "psych" ? p.psych : key === "flags" ? p.flags : p.neRate;
    const cmp = (a: SalespersonSummary, b: SalespersonSummary) => { const x = v(a), y = v(b); if (x === null) return 1; if (y === null) return -1; const c = typeof x === "string" ? x.localeCompare(y as string) : x - (y as number); return dir === "asc" ? c : -c; };
    return key === "name" ? [...people].sort(cmp) : [...people.filter((p) => !p.lowSample).sort(cmp), ...people.filter((p) => p.lowSample).sort(cmp)];
  }, [people, key, dir]);
  return (
    <>
      <PageHeader title="Sales Team" description={<>Performance per salesperson · {formatRange(range)}. Open a profile for strengths, missed criteria, flags and coaching.</>} actions={<Badge tone="warn">Illustrative mock data</Badge>} />
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<Skeleton className="h-[420px]" />}>
        <Card>
          {inR.length === 0 ? <EmptyState title="No calls in this date range" description="Pick a wider range from the date selector in the top bar." /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-[13px]">
              <thead className="border-y border-line bg-subtle/60 text-left"><tr>
                {COLS.map((c) => (
                  <th key={c.k} scope="col" aria-sort={c.k === key ? (dir === "asc" ? "ascending" : "descending") : undefined} className={cn("whitespace-nowrap px-4 py-2 text-xs font-medium text-ink-muted", c.right && "text-right")}>
                    <button onClick={() => { if (c.k === key) setDir((d) => (d === "asc" ? "desc" : "asc")); else { setKey(c.k); setDir(c.k === "name" ? "asc" : "desc"); } }} className={cn("inline-flex items-center gap-1 hover:text-ink", c.k === key && "text-ink")}>{c.label}{c.k === key ? (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}</button></th>))}
                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-ink-muted"><span className="inline-flex items-center gap-1">Trend <InfoTip text={`Change in sales-stage % versus the previous equal-length range. Only shown with at least ${MIN_SAMPLE} evaluated calls in both ranges.`} /></span></th>
              </tr></thead>
              <tbody className="divide-y divide-line">{sorted.map((p) => {
                const claim = trendClaim(rows.filter((r) => r.salesperson.id === p.salesperson.id), range);
                return (
                  <tr key={p.salesperson.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-3"><Link href={`/team/${p.salesperson.id}`} className="flex items-center gap-2.5 hover:text-brand"><Avatar name={p.salesperson.name} color={p.salesperson.avatar} size={30} /><span><span className="block font-medium text-ink">{p.salesperson.name}</span><span className="block text-xs text-ink-muted">{p.salesperson.role}</span></span></Link></td>
                    <td className="tabular px-4 py-3 text-right">{p.evaluated}{p.lowSample && <Badge tone="warn" className="ml-2">Low sample</Badge>}</td>
                    <td className="px-4 py-3">{p.stage === null ? "—" : <div className="flex items-center"><ScoreBar pct={p.stage} provisional /><span className="ml-1.5 text-xs text-ink-muted">n={p.evaluated}</span></div>}</td>
                    <td className="px-4 py-3">{p.psych === null ? "—" : <div className="flex items-center"><ScoreBar pct={p.psych} provisional /><span className="ml-1.5 text-xs text-ink-muted">n={p.evaluated}</span></div>}</td>
                    <td className="px-4 py-3"><FlagCount count={p.flags} severity={p.topSeverity} /></td>
                    <td className="tabular px-4 py-3 text-right text-ink-soft">{p.neRate === null ? "—" : `${(p.neRate * 100).toFixed(1)}%`}</td>
                    <td className="px-4 py-3 text-right">{p.lowSample ? <span className="text-xs text-ink-muted">Low sample</span> : <TrendDelta value={claim} unit=" pts" neutral />}</td>
                  </tr>);
              })}</tbody></table></div>
          )}
        </Card>
        <p className="mt-3 text-xs text-ink-muted">This is not a ranking. Every average shows its sample size (n) and is provisional where any criterion was Not Evaluable. Salespeople with fewer than {MIN_SAMPLE} evaluated calls are marked “Low sample”, listed last when sorting by a metric, and no trend is claimed for them.</p>
      </QueryGate>
    </>
  );
}
