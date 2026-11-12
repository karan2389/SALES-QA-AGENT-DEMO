import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { Select } from "./Form";

export function Pagination({ page, pageSize, total, onPage, onPageSize, sizes = [10, 25, 50] }: {
  page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize: (n: number) => void; sizes?: number[];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const window: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) window.push(i); else if (window[window.length - 1] !== "…") window.push("…");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px]">
      <div className="flex items-center gap-3 text-ink-muted">
        <span className="tabular">Showing <span className="font-medium text-ink">{from}–{to}</span> of <span className="font-medium text-ink">{total}</span></span>
        <label className="flex items-center gap-2">Rows per page
          <Select aria-label="Rows per page" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="w-[72px]">
            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        {window.map((p, i) => p === "…" ? <span key={`e${i}`} className="px-1 text-ink-muted">…</span> : (
          <button key={p} onClick={() => onPage(p)} aria-current={p === page ? "page" : undefined}
            className={`tabular h-8 min-w-8 rounded-md px-2 text-[13px] font-medium ${p === page ? "bg-brand text-white" : "text-ink-soft hover:bg-subtle"}`}>{p}</button>
        ))}
        <Button variant="secondary" size="icon" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
