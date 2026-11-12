"use client";
import { useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { DATE_PRESETS } from "@/config/ui";
import { customRange, dateKey, formatRange, resolvePreset } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { DatePreset, DateRangeValue } from "@/types";
import { Button } from "./Button";
import { Input } from "./Form";
import { Popover } from "./Popover";

export function DateRangePicker({ value, onChange, presets, compact }: { value: DateRangeValue; onChange: (r: DateRangeValue) => void; presets?: DatePreset[]; compact?: boolean }) {
  const [from, setFrom] = useState(dateKey(value.from));
  const [to, setTo] = useState(dateKey(value.to));
  const list = DATE_PRESETS.filter((p) => !presets || presets.includes(p.id));
  const label = DATE_PRESETS.find((p) => p.id === value.preset)?.label ?? "Custom range";

  return (
    <Popover align="right" panelClassName="w-[272px]"
      trigger={({ toggle, open }) => (
        <button onClick={toggle} aria-expanded={open} aria-label="Select date range"
          className={cn("flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-ink-soft shadow-card hover:bg-subtle", compact && "h-8")}>
          <CalendarDays className="h-4 w-4 text-ink-muted" />
          <span className="whitespace-nowrap">{value.preset === "custom" ? formatRange(value) : label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
        </button>
      )}>
      {({ close }) => (
        <div className="p-1.5">
          {list.filter((p) => p.id !== "custom").map((p) => (
            <button key={p.id} onClick={() => { onChange(resolvePreset(p.id)); setFrom(dateKey(resolvePreset(p.id).from)); setTo(dateKey(resolvePreset(p.id).to)); close(); }}
              className={cn("flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-subtle", value.preset === p.id ? "font-medium text-brand" : "text-ink-soft")}>
              {p.label}{value.preset === p.id && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
          {list.some((p) => p.id === "custom") && (
            <div className="mt-1 border-t border-line p-2.5">
              <p className="mb-2 text-xs font-medium text-ink-muted">Custom range</p>
              <div className="flex items-center gap-2">
                <Input type="date" aria-label="From date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-8 px-2 text-xs" />
                <span className="text-ink-muted">–</span>
                <Input type="date" aria-label="To date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-8 px-2 text-xs" />
              </div>
              <Button size="sm" variant="primary" className="mt-2.5 w-full justify-center" disabled={!from || !to}
                onClick={() => { onChange(customRange(from, to)); close(); }}>Apply range</Button>
            </div>
          )}
        </div>
      )}
    </Popover>
  );
}
