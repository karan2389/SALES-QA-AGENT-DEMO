import { Crosshair, UserCog } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { InfoTip } from "@/components/ui/Badges";
import { CATEGORIES } from "@/config/rubric";
import { bandFor } from "@/config/ui";
import { cn } from "@/lib/utils";
import type { CategoryId, Evaluation } from "@/types";

export function EvaluationBreakdown({ evaluation, activeCategory, onSelect }: { evaluation: Evaluation; activeCategory: CategoryId | null; onSelect: (c: CategoryId | null) => void }) {
  return (
    <Card>
      <CardHeader title="Evaluation breakdown" description="Category scores out of 100 — select a category to highlight its transcript evidence"
        actions={<InfoTip text="Categories are provisional and derived from the supplied sales checklist. Weights are unequal placeholders, not approved scoring rules." />} />
      <ul className="divide-y divide-line px-2 pb-2">
        {CATEGORIES.map((c) => {
          const s = evaluation.categoryScores[c.id];
          const band = bandFor(s.score);
          const active = activeCategory === c.id;
          return (
            <li key={c.id}>
              <button onClick={() => onSelect(active ? null : c.id)} aria-pressed={active} title={c.description}
                className={cn("grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-md px-2 py-2 text-left transition-colors hover:bg-subtle sm:grid-cols-[minmax(0,230px)_1fr_auto]", active && "bg-brand-soft/60")}>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">{c.label}</span>
                  <span className="text-2xs text-ink-muted">Weight {c.weight}%</span>
                </span>
                <span className="col-span-2 order-last h-2 overflow-hidden rounded-full bg-line sm:order-none sm:col-span-1" role="meter" aria-label={`${c.label} score`} aria-valuenow={s.score} aria-valuemin={0} aria-valuemax={100}>
                  <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${s.score}%`, background: band.color }} />
                </span>
                <span className="flex items-center justify-end gap-1.5">
                  {s.adjustedByManager && <span title={`Manager-adjusted from ${s.originalScore}`} className="text-brand"><UserCog className="h-3.5 w-3.5" /></span>}
                  <span className="tabular w-7 text-right text-[13px] font-semibold">{s.score}</span>
                  <Crosshair className={cn("h-3.5 w-3.5", active ? "text-brand" : "text-ink-muted/50")} aria-hidden />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
