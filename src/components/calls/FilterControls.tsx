"use client";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/Form";
import { Input } from "@/components/ui/Form";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import type { RangeTuple } from "./filters";

export function FilterButton({ label, summary, active, children, width = 240 }: { label: string; summary?: string; active: boolean; children: ReactNode | ((p: { close: () => void }) => ReactNode); width?: number }) {
  return (
    <Popover panelClassName={cn("p-1.5")} trigger={({ toggle, open }) => (
      <button onClick={toggle} aria-expanded={open}
        className={cn("flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-[13px] font-medium transition-colors",
          active ? "border-brand/30 bg-brand-soft text-brand" : "border-line bg-surface text-ink-soft hover:bg-subtle")}>
        {label}
        {summary && <span className="rounded bg-brand/10 px-1 text-xs tabular">{summary}</span>}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
    )}>
      {(p) => <div style={{ width }}>{typeof children === "function" ? children(p) : children}</div>}
    </Popover>
  );
}

export function MultiSelectFilter<T extends string>({ label, options, value, onChange, width }: {
  label: string; options: { id: T; label: string; hint?: string }[]; value: T[]; onChange: (v: T[]) => void; width?: number;
}) {
  const toggle = (id: T) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <FilterButton label={label} summary={value.length ? String(value.length) : undefined} active={value.length > 0} width={width}>
      <ul className="max-h-[280px] overflow-y-auto">
        {options.map((o) => (
          <li key={o.id} className="rounded px-2 py-1.5 hover:bg-subtle">
            <Checkbox checked={value.includes(o.id)} onChange={() => toggle(o.id)} className="w-full" label={<span className="flex w-full items-center justify-between gap-2"><span>{o.label}</span>{o.hint && <span className="text-xs text-ink-muted">{o.hint}</span>}</span>} />
          </li>
        ))}
      </ul>
      {value.length > 0 && <button onClick={() => onChange([])} className="mt-1 w-full rounded px-2 py-1.5 text-left text-xs font-medium text-brand hover:bg-subtle">Clear selection</button>}
    </FilterButton>
  );
}

export function RangeFilter({ label, value, onChange, presets }: { label: string; value: RangeTuple; onChange: (v: RangeTuple) => void; presets?: { label: string; range: RangeTuple }[] }) {
  const active = value[0] > 0 || value[1] < 100;
  const set = (i: 0 | 1, raw: string) => {
    const n = raw === "" ? (i === 0 ? 0 : 100) : Math.max(0, Math.min(100, Number(raw)));
    const next: RangeTuple = i === 0 ? [n, value[1]] : [value[0], n];
    onChange(next);
  };
  const invalid = value[0] > value[1];
  return (
    <FilterButton label={label} summary={active ? `${value[0]}–${value[1]}` : undefined} active={active} width={236}>
      <div className="p-1.5">
        <div className="flex items-center gap-2">
          <label className="flex-1 text-xs text-ink-muted">Min<Input type="number" min={0} max={100} value={value[0]} onChange={(e) => set(0, e.target.value)} className="mt-1 h-8 px-2" /></label>
          <label className="flex-1 text-xs text-ink-muted">Max<Input type="number" min={0} max={100} value={value[1]} onChange={(e) => set(1, e.target.value)} className="mt-1 h-8 px-2" /></label>
        </div>
        {invalid && <p className="mt-1.5 text-xs text-bad">Min is above max — no calls will match.</p>}
        {presets && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button key={p.label} onClick={() => onChange(p.range)} className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-soft hover:bg-subtle">{p.label}</button>
            ))}
          </div>
        )}
        {active && <button onClick={() => onChange([0, 100])} className="mt-2 text-xs font-medium text-brand hover:underline">Reset</button>}
      </div>
    </FilterButton>
  );
}

export function RadioFilter<T extends string>({ label, options, value, defaultValue, onChange }: { label: string; options: { id: T; label: string }[]; value: T; defaultValue: T; onChange: (v: T) => void }) {
  const active = value !== defaultValue;
  return (
    <FilterButton label={label} summary={active ? options.find((o) => o.id === value)?.label : undefined} active={active} width={200}>
      {({ close }) => (
        <ul role="radiogroup" aria-label={label}>
          {options.map((o) => (
            <li key={o.id}>
              <button role="radio" aria-checked={value === o.id} onClick={() => { onChange(o.id); close(); }}
                className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] hover:bg-subtle", value === o.id ? "font-medium text-brand" : "text-ink-soft")}>
                <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full border", value === o.id ? "border-brand" : "border-ink-muted/40")}>{value === o.id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}</span>
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </FilterButton>
  );
}
