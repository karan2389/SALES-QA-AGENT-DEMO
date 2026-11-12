"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((p: { close: () => void }) => ReactNode);
  align?: "left" | "right";
  panelClassName?: string;
  className?: string;
}

/** Click-outside / Escape aware dropdown panel. */
export function Popover({ trigger, children, align = "left", panelClassName, className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <div ref={ref} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={cn("absolute top-full z-40 mt-1.5 min-w-[200px] rounded-lg border border-line bg-surface shadow-pop animate-in",
          align === "right" ? "right-0" : "left-0", panelClassName)}>
          {typeof children === "function" ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}
