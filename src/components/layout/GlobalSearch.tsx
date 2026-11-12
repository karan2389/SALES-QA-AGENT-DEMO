"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneCall, Search, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Badges";
import { useDataset } from "@/hooks/useDataset";
import { useDebounce } from "@/hooks/useDebounce";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Result = { kind: "call"; id: string; title: string; sub: string } | { kind: "person"; id: string; title: string; sub: string; color: string };

export function GlobalSearch() {
  const router = useRouter();
  const { rows, salespeople } = useDataset();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const dq = useDebounce(q, 120).trim().toLowerCase();
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const { results, totalCalls } = useMemo(() => {
    if (!dq) return { results: [] as Result[], totalCalls: 0 };
    const calls = rows.filter((r) => [r.call.id, r.call.callyzerCallId, r.call.prospectName, r.call.phoneNumber, r.salesperson.name].some((s) => s.toLowerCase().includes(dq)));
    const people = salespeople.filter((s) => s.name.toLowerCase().includes(dq) || s.team.toLowerCase().includes(dq));
    const res: Result[] = [
      ...people.slice(0, 3).map((s): Result => ({ kind: "person", id: s.id, title: s.name, sub: `${s.role} · ${s.team}`, color: s.avatar })),
      ...calls.slice(0, 5).map((r): Result => ({ kind: "call", id: r.call.id, title: `${r.call.id} · ${r.call.prospectName}`, sub: `${r.salesperson.name} · ${formatShortDate(r.call.callDate)}` })),
    ];
    return { results: res, totalCalls: calls.length };
  }, [dq, rows, salespeople]);

  useEffect(() => setActive(0), [dq]);
  useEffect(() => {
    const down = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); setOpen(true); } };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, []);

  const go = (r?: Result) => {
    setOpen(false);
    if (r) { router.push(r.kind === "call" ? `/calls/${r.id}` : `/team/${r.id}`); setQ(""); }
    else if (q.trim()) { router.push(`/calls?q=${encodeURIComponent(q.trim())}`); setQ(""); }
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(results.length && !e.shiftKey ? results[active] : undefined); }
    else if (e.key === "Escape") { setOpen(false); input.current?.blur(); }
  };

  return (
    <div ref={box} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
        role="combobox" aria-expanded={open && !!dq} aria-controls="global-search-list" aria-label="Search calls, prospects and salespeople"
        placeholder="Search calls, prospects, salespeople…"
        className="h-9 w-full rounded-md border border-line bg-subtle pl-8 pr-12 text-sm placeholder:text-ink-muted/80 focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20" />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 text-2xs text-ink-muted sm:block">Ctrl K</kbd>
      {open && dq && (
        <div id="global-search-list" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-line bg-surface shadow-pop animate-in">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-[13px] text-ink-muted">No calls or salespeople match “{q}”.</p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto py-1">
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`} role="option" aria-selected={i === active}>
                  <button onMouseEnter={() => setActive(i)} onClick={() => go(r)}
                    className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left", i === active && "bg-subtle")}>
                    {r.kind === "person" ? <Avatar name={r.title} color={r.color} size={24} />
                      : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand"><PhoneCall className="h-3 w-3" /></span>}
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">{r.title}</span>
                      <span className="block truncate text-xs text-ink-muted">{r.sub}</span>
                    </span>
                    {r.kind === "person" && <Users className="ml-auto h-3.5 w-3.5 text-ink-muted" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => go()} className="flex w-full items-center justify-between border-t border-line bg-subtle px-3 py-2 text-xs font-medium text-brand hover:bg-brand-soft">
            <span>Search all calls for “{q}” in Call Explorer</span>
            <span className="text-ink-muted">{totalCalls} call{totalCalls === 1 ? "" : "s"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
