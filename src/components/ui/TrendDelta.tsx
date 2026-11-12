import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Signed change with arrow. `goodWhen` controls which direction is coloured positive. */
export function TrendDelta({ value, unit = "", digits = 1, goodWhen = "up", threshold = 0.5, className }: {
  value: number | null; unit?: string; digits?: number; goodWhen?: "up" | "down"; threshold?: number; className?: string;
}) {
  if (value === null) return <span className={cn("text-xs text-ink-muted", className)} title="Not enough evaluated calls in both periods">—</span>;
  const flat = Math.abs(value) < threshold;
  const up = value > 0;
  const good = flat ? null : (up && goodWhen === "up") || (!up && goodWhen === "down");
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("tabular inline-flex items-center gap-0.5 text-xs font-medium", good === null ? "text-ink-muted" : good ? "text-good" : "text-bad", className)}>
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : ""}{value.toFixed(digits)}{unit}
    </span>
  );
}
