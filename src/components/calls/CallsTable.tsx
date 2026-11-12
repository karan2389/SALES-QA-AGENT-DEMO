"use client";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Flag } from "lucide-react";
import { ScoreBar } from "@/components/charts/ScoreIndicators";
import { EvalStatusBadge, OutcomeBadge, ReviewStatusBadge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Form";
import { Skeleton } from "@/components/ui/States";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatDate, formatDuration, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CallRow } from "@/types";
import type { SortKey, SortState } from "./filters";

interface Col { label: string; sort?: SortKey; className?: string }
const COLS: Col[] = [
  { label: "Call ID", sort: "id" }, { label: "Prospect", sort: "prospect" }, { label: "Salesperson", sort: "salesperson" },
  { label: "Date", sort: "date" }, { label: "Duration", sort: "duration" }, { label: "Outcome" },
  { label: "Quality score", sort: "quality" }, { label: "Evaluation" }, { label: "Review" }, { label: "Actions", className: "text-right" },
];

export function CallsTable({ rows, loading, sort, onSort, selected, onToggle, onTogglePage, onFlag }: {
  rows: CallRow[]; loading?: boolean; sort: SortState; onSort: (k: SortKey) => void;
  selected: Set<string>; onToggle: (id: string) => void; onTogglePage: (all: boolean) => void; onFlag: (row: CallRow) => void;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.call.id));
  const someSelected = rows.some((r) => selected.has(r.call.id));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-[13px]">
        <thead className="border-y border-line bg-subtle/60 text-left">
          <tr>
            <th scope="col" className="w-10 px-4 py-2"><Checkbox aria-label="Select all rows on this page" checked={allSelected} indeterminate={someSelected} onChange={onTogglePage} /></th>
            {COLS.map((c) => {
              const active = c.sort === sort.key;
              return (
                <th key={c.label} scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined} className={cn("whitespace-nowrap px-3 py-2 text-xs font-medium text-ink-muted", c.className)}>
                  {c.sort ? (
                    <button onClick={() => onSort(c.sort!)} className={cn("inline-flex items-center gap-1 hover:text-ink", active && "text-ink")}>
                      {c.label}{active ? (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  ) : c.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <tr key={i}><td colSpan={COLS.length + 1} className="px-4 py-2.5"><Skeleton className="h-6" /></td></tr>)
            : rows.map((r) => {
              const isSel = selected.has(r.call.id);
              return (
                <tr key={r.call.id} className={cn("group hover:bg-subtle/60", isSel && "bg-brand-soft/50")}>
                  <td className="px-4 py-2.5"><Checkbox aria-label={`Select ${r.call.id}`} checked={isSel} onChange={() => onToggle(r.call.id)} /></td>
                  <td className="whitespace-nowrap px-2.5 py-2.5"><Link href={`/calls/${r.call.id}`} className="font-medium text-brand hover:underline">{r.call.id}</Link></td>
                  <td className="px-2.5 py-2.5"><p className="whitespace-nowrap font-medium text-ink">{r.call.prospectName}</p><p className="whitespace-nowrap text-xs text-ink-muted">{r.call.phoneNumber}</p></td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-ink-soft">{r.salesperson.name}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-ink-soft">{formatDate(r.call.callDate)}<span className="block text-xs text-ink-muted">{formatTime(r.call.callDate)}</span></td>
                  <td className="tabular whitespace-nowrap px-2.5 py-2.5 text-ink-soft">{formatDuration(r.call.durationSeconds)}</td>
                  <td className="px-2.5 py-2.5"><OutcomeBadge outcome={r.call.outcome} /></td>
                  <td className="px-2.5 py-2.5"><ScoreBar score={r.overall} /></td>
                  <td className="px-2.5 py-2.5"><EvalStatusBadge status={r.call.evaluationStatus} /></td>
                  <td className="px-2.5 py-2.5"><ReviewStatusBadge status={r.call.reviewStatus} /></td>
                  <td className="px-2.5 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Tooltip content="Open call report"><Link href={`/calls/${r.call.id}`} aria-label={`Open ${r.call.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-subtle hover:text-ink"><Eye className="h-4 w-4" /></Link></Tooltip>
                      <Tooltip content={r.call.reviewStatus === "pending_review" ? "Already pending review" : "Mark for review"}>
                        <Button variant="ghost" size="icon" aria-label={`Mark ${r.call.id} for review`} disabled={r.call.reviewStatus === "pending_review" || r.call.evaluationStatus === "processing"} onClick={() => onFlag(r)}><Flag className="h-4 w-4" /></Button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
