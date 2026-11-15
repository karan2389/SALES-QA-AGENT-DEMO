"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react";
import { EvalStatusBadge, FlagCount, GateBadge, ProvisionalPill, ReviewChip, ScoreBar, Term } from "@/components/ui/Badges";
import { Checkbox } from "@/components/ui/Form";
import { Skeleton } from "@/components/ui/States";
import { Tooltip } from "@/components/ui/Tooltip";
import { CALL_TYPE_LABEL, TERMS } from "@/config/mrv1";
import { formatDate, formatDuration, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Row } from "@/types";
import type { SortKey, SortState } from "./filters";

interface Col { label: React.ReactNode; sort?: SortKey; className?: string }
const COLS: Col[] = [
  { label: "Callyzer ID", sort: "id" }, { label: "Salesperson", sort: "salesperson" }, { label: "Call date", sort: "date" }, { label: "Duration", sort: "duration" },
  { label: "Call type" }, { label: <Term tip={TERMS.stage}>Sales-stage %</Term>, sort: "stage" }, { label: <Term tip={TERMS.psych}>Psychology %</Term>, sort: "psych" },
  { label: "Flags", sort: "flag" }, { label: <Term tip={TERMS.gate}>Gate status</Term> }, { label: "Human review" },
];

export function CallsTable({ rows, loading, sort, onSort, selectable, selected, onToggle, onTogglePage, minWidth = 1180 }: {
  rows: Row[]; loading?: boolean; sort?: SortState; onSort?: (k: SortKey) => void; selectable?: boolean; selected?: Set<string>;
  onToggle?: (id: string) => void; onTogglePage?: (all: boolean) => void; minWidth?: number;
}) {
  const router = useRouter();
  const sel = selected ?? new Set<string>();
  const allSelected = rows.length > 0 && rows.every((r) => sel.has(r.call.id));
  const someSelected = rows.some((r) => sel.has(r.call.id));
  const cols = COLS.length + (selectable ? 2 : 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]" style={{ minWidth }}>
        <thead className="border-y border-line bg-subtle/60 text-left">
          <tr>
            {selectable && <th scope="col" className="w-10 px-4 py-2"><Checkbox aria-label="Select all rows on this page" checked={allSelected} indeterminate={someSelected} onChange={(v) => onTogglePage?.(v)} /></th>}
            {COLS.map((c, i) => {
              const active = !!c.sort && sort?.key === c.sort;
              return (
                <th key={i} scope="col" aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined} className={cn("whitespace-nowrap px-2.5 py-2 text-xs font-medium text-ink-muted", c.className)}>
                  {c.sort && onSort ? <button onClick={() => onSort(c.sort!)} className={cn("inline-flex items-center gap-1 hover:text-ink", active && "text-ink")}>{c.label}{active ? (sort!.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}</button> : c.label}
                </th>
              );
            })}
            <th scope="col" className="w-10 px-2.5 py-2"><span className="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading ? Array.from({ length: 8 }, (_, i) => <tr key={i}><td colSpan={cols} className="px-4 py-2.5"><Skeleton className="h-6" /></td></tr>)
            : rows.map((r) => (
              <tr key={r.call.id} onClick={selectable ? undefined : () => router.push(`/calls/${r.call.id}`)} className={cn("hover:bg-subtle/60", !selectable && "cursor-pointer", sel.has(r.call.id) && "bg-brand-soft/50")}>
                {selectable && <td className="px-4 py-2.5"><Checkbox aria-label={`Select ${r.call.id}`} checked={sel.has(r.call.id)} onChange={() => onToggle?.(r.call.id)} /></td>}
                <td className="whitespace-nowrap px-2.5 py-2.5">
                  <Link href={`/calls/${r.call.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-brand hover:underline">{r.call.id}</Link>
                  {r.call.status !== "evaluated" && <div className="mt-0.5"><EvalStatusBadge status={r.call.status} /></div>}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2.5 text-ink">{r.salesperson.name}</td>
                <td className="whitespace-nowrap px-2.5 py-2.5 text-ink-soft">{formatDate(r.call.callDate)}<span className="block text-xs text-ink-muted">{formatTime(r.call.callDate)}</span></td>
                <td className="tabular whitespace-nowrap px-2.5 py-2.5 text-ink-soft">{formatDuration(r.call.durationSec)}</td>
                <td className="px-2.5 py-2.5 text-ink-soft"><span className="whitespace-nowrap">{CALL_TYPE_LABEL[r.call.callType]}</span><span className="block whitespace-nowrap text-xs text-ink-muted">{r.call.callTypeConfirmedBy ? `confirmed by ${r.call.callTypeConfirmedBy}` : "unconfirmed"}</span></td>
                <td className="px-2.5 py-2.5">{r.doc ? <ScoreBar pct={r.stage} provisional={r.provisional} /> : <Tooltip content={r.call.heldReason ?? "No score"}><span className="text-xs text-ink-muted">No score</span></Tooltip>}</td>
                <td className="px-2.5 py-2.5">{r.doc ? <ScoreBar pct={r.psych} provisional={r.doc.scores.psychology.provisional} /> : <span className="text-xs text-ink-muted">—</span>}</td>
                <td className="px-2.5 py-2.5">{r.doc ? <FlagCount count={r.flagCount} severity={r.topSeverity} /> : <span className="text-xs text-ink-muted">—</span>}</td>
                <td className="px-2.5 py-2.5"><GateBadge status={r.gate} /></td>
                <td className="px-2.5 py-2.5"><ReviewChip status={r.review} /></td>
                <td className="px-2.5 py-2.5"><Link href={`/calls/${r.call.id}`} onClick={(e) => e.stopPropagation()} aria-label={`Open ${r.call.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-subtle hover:text-ink"><Eye className="h-4 w-4" /></Link></td>
              </tr>
            ))}
        </tbody>
      </table>
      {!loading && rows.some((r) => r.provisional) && <p className="flex items-center gap-2 border-t border-line px-4 py-2 text-xs text-ink-muted"><ProvisionalPill />An amber dot means the score is provisional (at least one Not Evaluable criterion).</p>}
    </div>
  );
}
