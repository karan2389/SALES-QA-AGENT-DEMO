"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";
import { CallsTable } from "@/components/calls/CallsTable";
import { MultiSelectFilter, RadioFilter } from "@/components/calls/FilterControls";
import { activeChips, applyFilters, clearFilter, defaultDirFor, defaultFilters, filtersFromParams, presetIdFor, SORT_PRESETS, sortRows, type CallFilters, type SortKey, type SortState } from "@/components/calls/filters";
import { Badge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { SearchInput, Select } from "@/components/ui/Form";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { CALL_TYPES } from "@/config/mrv1";
import { DURATION_BUCKETS, LANGUAGE_LABEL } from "@/config/ui";
import { useDataset } from "@/hooks/useDataset";
import { useDebounce } from "@/hooks/useDebounce";
import { usePersistentState } from "@/hooks/usePersistentState";
import { callsToCsv, downloadCsv, stamp } from "@/lib/csv";
import { plural } from "@/lib/utils";
import { getPrototypeSettings, setPrototypeSettings } from "@/services";
import type { Row } from "@/types";

function Explorer({ initial }: { initial: CallFilters }) {
  const toast = useToast();
  const { rows, salespeople, loading, error, reload } = useDataset();
  const [filters, setFilters] = useState<CallFilters>(initial);
  const [qInput, setQInput] = useState(initial.q);
  const dq = useDebounce(qInput, 250);
  const [sort, setSort] = useState<SortState>({ key: "date", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePersistentState("ffci2:calls-page-size", 10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => setFilters((f) => (f.q === dq ? f : { ...f, q: dq })), [dq]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [filters, sort, pageSize]);

  const names = useMemo(() => Object.fromEntries(salespeople.map((s) => [s.id, s.name])), [salespeople]);
  const filtered = useMemo(() => sortRows(applyFilters(rows, filters), sort), [rows, filters, sort]);
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);
  const chips = activeChips(filters, names);
  const patch = useCallback((p: Partial<CallFilters>) => setFilters((f) => ({ ...f, ...p })), []);
  const clearAll = () => { setQInput(""); setFilters(defaultFilters()); };
  const onSort = (k: SortKey) => setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: defaultDirFor(k) }));
  const exportRows = (rs: Row[], label: string) => { downloadCsv(`flexifunnels-calls-${label}-${stamp()}.csv`, callsToCsv(rs)); toast({ tone: "success", title: `Exported ${plural(rs.length, "call")}`, description: "CSV in the Google Sheet layout (illustrative mock data)." }); };
  const pageAll = pageRows.length > 0 && pageRows.every((r) => selected.has(r.call.id));

  return (
    <>
      <PageHeader title="Call Explorer" description="Search, filter and sort every call. Filters combine; open a call for the 14-section MRV1 report."
        actions={<Button onClick={() => exportRows(filtered, "filtered")} disabled={!filtered.length}><Download className="h-4 w-4" />Export filtered CSV</Button>} />
      <Card>
        <div className="space-y-3 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput className="w-full sm:w-[400px]" value={qInput} onChange={(e) => setQInput(e.target.value)} aria-label="Search calls" placeholder="Search Callyzer ID, salesperson, call type, status…" />
            <label className="ml-auto flex items-center gap-2 text-[13px] text-ink-muted">Sort
              <Select aria-label="Sort calls" value={presetIdFor(sort)} onChange={(e) => { const p = SORT_PRESETS.find((x) => x.id === e.target.value); if (p) setSort(p.sort); }} className="w-[250px]">
                {presetIdFor(sort) === "custom" && <option value="custom">Custom (column sort)</option>}
                {SORT_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </Select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
            <DateRangePicker compact value={filters.date} onChange={(date) => patch({ date })} />
            <MultiSelectFilter label="Salesperson" value={filters.salespersonIds} onChange={(v) => patch({ salespersonIds: v })} options={salespeople.map((s) => ({ id: s.id, label: s.name }))} />
            <MultiSelectFilter label="Call type" width={260} value={filters.callTypes} onChange={(v) => patch({ callTypes: v })} options={CALL_TYPES.map((c) => ({ id: c.id, label: c.label }))} />
            <MultiSelectFilter label="Evaluation status" value={filters.evalStatuses} onChange={(v) => patch({ evalStatuses: v })} options={[{ id: "evaluated", label: "Evaluated" }, { id: "held", label: "Held (gate)" }, { id: "processing", label: "Processing" }, { id: "failed", label: "Failed" }]} />
            <MultiSelectFilter label="Gate decision" value={filters.gates} onChange={(v) => patch({ gates: v })} options={[{ id: "pass", label: "Passed" }, { id: "review", label: "Needs acknowledgement" }, { id: "blocked", label: "Blocked" }]} />
            <MultiSelectFilter label="Flags" value={filters.flags} onChange={(v) => patch({ flags: v })} options={[{ id: "none", label: "No flags" }, { id: "critical", label: "Critical severity" }, { id: "high", label: "High severity" }, { id: "medium", label: "Medium severity" }, { id: "low", label: "Low severity" }]} />
            <MultiSelectFilter label="Human review" value={filters.reviews} onChange={(v) => patch({ reviews: v })} options={[{ id: "pending", label: "Pending human review" }, { id: "approved", label: "Approved by human" }, { id: "disputed", label: "Disputed" }]} />
            <MultiSelectFilter label="Language" value={filters.languages} onChange={(v) => patch({ languages: v })} options={Object.entries(LANGUAGE_LABEL).map(([id, label]) => ({ id: id as "hindi", label }))} />
            <MultiSelectFilter label="Provisional / final" value={filters.finality} onChange={(v) => patch({ finality: v })} options={[{ id: "provisional", label: "Provisional" }, { id: "final", label: "Final (no NE)" }]} />
            <RadioFilter label="Duration" value={filters.duration} defaultValue="any" onChange={(v) => patch({ duration: v })} options={DURATION_BUCKETS.map((d) => ({ id: d.id, label: d.label }))} />
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3" aria-label="Active filters">
              {chips.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand-soft py-0.5 pl-2.5 pr-1 text-xs font-medium text-brand">{c.label}
                  <button onClick={() => { if (c.id === "q") setQInput(""); setFilters((f) => clearFilter(f, c.id)); }} aria-label={`Remove filter ${c.label}`} className="rounded-full p-0.5 hover:bg-brand/15"><X className="h-3 w-3" /></button></span>
              ))}
              <button onClick={clearAll} className="text-xs font-medium text-ink-muted hover:text-ink hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line bg-brand-soft/60 px-4 py-2.5" role="region" aria-label="Bulk actions">
            <span className="text-[13px] font-medium text-brand">{plural(selected.size, "call")} selected</span>
            {pageAll && filtered.length > selected.size && <button onClick={() => setSelected(new Set(filtered.map((r) => r.call.id)))} className="text-[13px] font-medium text-brand underline">Select all {filtered.length} matching calls</button>}
            <div className="ml-auto flex gap-2">
              <Button size="sm" onClick={() => exportRows(rows.filter((r) => selected.has(r.call.id)), "selected")}><Download className="h-3.5 w-3.5" />Export selected</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear selection</Button>
            </div>
          </div>
        )}
        {error && rows.length === 0 ? <ErrorState error={error} onRetry={reload} simulated={getPrototypeSettings().error} onDisableSimulation={() => { setPrototypeSettings({ error: false }); reload(); }} />
          : !loading && filtered.length === 0 ? <EmptyState title="No calls match these filters" description="Filters combine, so each one narrows the results. Try removing one." action={<Button variant="primary" onClick={clearAll}>Clear all filters</Button>} />
          : (<>
            <CallsTable rows={pageRows} loading={loading && rows.length === 0} sort={sort} onSort={onSort} selectable selected={selected}
              onToggle={(id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
              onTogglePage={(all) => setSelected((s) => { const n = new Set(s); pageRows.forEach((r) => (all ? n.add(r.call.id) : n.delete(r.call.id))); return n; })} />
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
          </>)}
      </Card>
      <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted"><Badge tone="warn">Mock data</Badge>Held, processing and failed calls have no score and always sort last when sorting by score.</p>
    </>
  );
}

function Route() {
  const params = useSearchParams();
  const key = params.toString();
  const initial = useMemo(() => filtersFromParams(new URLSearchParams(key)), [key]);
  return <Explorer key={key} initial={initial} />;
}
export default function CallsPage() { return <Suspense fallback={<Skeleton className="h-[480px]" />}><Route /></Suspense>; }
