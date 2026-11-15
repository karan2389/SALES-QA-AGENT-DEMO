"use client";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/Form";
import { CATEGORIES } from "@/config/mrv1";
import { cn } from "@/lib/utils";
import type { CriterionEval, Mrv1Document } from "@/types";
import { CriterionRow } from "./CriterionRow";
import { Section } from "./primitives";

type Filter = { low: boolean; ne: boolean; flagged: boolean; capped: boolean };
const NONE: Filter = { low: false, ne: false, flagged: false, capped: false };

function FilterBar({ f, setF, shown, total }: { f: Filter; setF: (f: Filter) => void; shown: number; total: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-subtle/70 px-3 py-2" role="group" aria-label="Criterion filters">
      <Checkbox checked={f.low} onChange={(v) => setF({ ...f, low: v })} label="Only 0–1 scores" />
      <Checkbox checked={f.ne} onChange={(v) => setF({ ...f, ne: v })} label="Only NE" />
      <Checkbox checked={f.flagged} onChange={(v) => setF({ ...f, flagged: v })} label="Only flagged" />
      <Checkbox checked={f.capped} onChange={(v) => setF({ ...f, capped: v })} label="Only capped" />
      <span className="tabular ml-auto text-xs text-ink-muted" aria-live="polite">Showing {shown} of {total} criteria</span>
    </div>
  );
}

const matches = (c: CriterionEval, f: Filter, flaggedIds: Set<string>) =>
  (!f.low || (typeof c.outcome === "number" && c.outcome <= 1)) && (!f.ne || c.outcome === "NE") && (!f.flagged || flaggedIds.has(c.id)) && (!f.capped || !!c.cap);

export function S6Criteria({ doc }: { doc: Mrv1Document }) {
  const [f, setF] = useState<Filter>(NONE);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const flaggedIds = useMemo(() => new Set(doc.extras.flags.flatMap((x) => x.capsCriteria)), [doc]);
  const active = f.low || f.ne || f.flagged || f.capped;
  const shown = doc.sales_stage.filter((c) => matches(c, f, flaggedIds)).length;
  return (
    <Section id="s6" n={6} title="Detailed Criterion Evaluation" desc="70 criteria with verbatim evidence, explanation and improvement guidance. Open a criterion for details.">
      <FilterBar f={f} setF={setF} shown={shown} total={doc.sales_stage.length} />
      {shown === 0 && <p className="rounded-md bg-subtle px-3 py-6 text-center text-[13px] text-ink-muted">No criteria match these filters.</p>}
      <div className="space-y-2">
        {CATEGORIES.map((cat) => {
          const crits = doc.sales_stage.filter((c) => c.categoryId === cat.id && matches(c, f, flaggedIds));
          if (!crits.length) return null;
          const res = doc.scores.categories.find((c) => c.id === cat.id)!;
          const isOpen = active || open.has(cat.id);
          return (
            <div key={cat.id} className="rounded-lg border border-line">
              <button onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(cat.id)) n.delete(cat.id); else n.add(cat.id); return n; })} aria-expanded={isOpen} className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-subtle/60">
                <ChevronDown className={cn("h-4 w-4 text-ink-muted transition-transform", !isOpen && "-rotate-90")} />
                <span className="tabular text-xs font-semibold text-ink-muted">{cat.id}</span><span className="flex-1 text-[13px] font-semibold">{cat.name}</span>
                <span className="tabular text-xs text-ink-muted">{res.pct === null ? "—" : `${res.pct.toFixed(0)}%`} · scored {res.scored} · N/A {res.na} · NE {res.ne}</span>
              </button>
              {isOpen && <div className="space-y-1.5 border-t border-line p-2">{crits.map((c) => <CriterionRow key={c.id} c={c} />)}</div>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function S7Psychology({ doc }: { doc: Mrv1Document }) {
  const [f, setF] = useState<Filter>(NONE);
  const flaggedIds = useMemo(() => new Set<string>(), []);
  const list = doc.psychology.filter((c) => matches(c, f, flaggedIds));
  const s = doc.scores.psychology;
  return (
    <Section id="s7" n={7} title="Sales Psychology & Conduct" accent desc="A different scorecard (SP-01…SP-22). Reported separately and never blended with the sales-stage score.">
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-teal-600/25 bg-teal-50 px-3 py-2 text-[13px] text-teal-900">
        <span className="font-semibold">Scorecard result: {s.pct === null ? "—" : `${s.pct.toFixed(1)}%${s.provisional ? " (provisional)" : ""}`}</span><span className="tabular text-xs">scored {s.scored} · N/A {s.na} · NE {s.ne}</span>
      </div>
      <FilterBar f={{ ...f, flagged: false }} setF={(x) => setF({ ...x, flagged: false })} shown={list.length} total={doc.psychology.length} />
      <div className="space-y-1.5">{list.map((c) => <CriterionRow key={c.id} c={c} />)}</div>
      {list.length === 0 && <p className="rounded-md bg-subtle px-3 py-6 text-center text-[13px] text-ink-muted">No criteria match these filters.</p>}
    </Section>
  );
}
