"use client";
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const field = "h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted/70 transition-colors hover:border-ink-muted/40 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(field, className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(field, "h-auto min-h-[84px] py-2 leading-snug", className)} {...p} />;
});

export function SearchInput({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input type="search" className={cn(field, "pl-8")} {...p} />
    </div>
  );
}

export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(field, "appearance-none pr-8")} {...p}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
    </div>
  );
}

export function Checkbox({ checked, indeterminate, onChange, label, className, ...rest }: {
  checked: boolean; indeterminate?: boolean; onChange: (v: boolean) => void; label?: ReactNode; className?: string; "aria-label"?: string;
}) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft", className)}>
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <input type="checkbox" className="peer absolute inset-0 h-4 w-4 cursor-pointer opacity-0" checked={checked}
          ref={(el) => { if (el) el.indeterminate = !!indeterminate && !checked; }}
          onChange={(e) => onChange(e.target.checked)} aria-label={rest["aria-label"]} />
        <span className={cn("flex h-4 w-4 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50",
          checked || indeterminate ? "border-brand bg-brand text-white" : "border-ink-muted/40 bg-surface")}>
          {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : indeterminate ? <span className="h-0.5 w-2 rounded bg-white" /> : null}
        </span>
      </span>
      {label}
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options, size = "md", ariaLabel }: {
  value: T; onChange: (v: T) => void; options: { id: T; label: string; count?: number }[]; size?: "sm" | "md"; ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex max-w-full overflow-x-auto rounded-md border border-line bg-subtle p-0.5 scroll-thin">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} onClick={() => onChange(o.id)}
          className={cn("flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 font-medium transition-colors",
            size === "sm" ? "h-6 text-xs" : "h-7 text-[13px]",
            value === o.id ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink")}>
          {o.label}
          {o.count !== undefined && <span className={cn("tabular rounded-full px-1.5 text-2xs", value === o.id ? "bg-brand-soft text-brand" : "bg-line/60 text-ink-muted")}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
