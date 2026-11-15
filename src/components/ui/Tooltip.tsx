"use client";
import { useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "right";

/** Small portal tooltip (never clipped by overflow containers). Shows on hover and keyboard focus. */
export function Tooltip({ content, children, side = "top", className }: { content: ReactNode; children: ReactNode; side?: Side; className?: string }) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(side === "right" ? { x: r.right + 8, y: r.top + r.height / 2 }
      : side === "bottom" ? { x: r.left + r.width / 2, y: r.bottom + 8 }
      : { x: r.left + r.width / 2, y: r.top - 8 });
  };
  const hide = () => setPos(null);
  const transform = side === "right" ? "translate(0,-50%)" : side === "bottom" ? "translate(-50%,0)" : "translate(-50%,-100%)";

  return (
    <span ref={ref} className={cn("inline-flex", className)} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} aria-describedby={pos ? id : undefined}>
      {children}
      {pos && typeof document !== "undefined" && createPortal(
        <div id={id} role="tooltip" style={{ left: pos.x, top: pos.y, transform }}
          className="pointer-events-none fixed z-[100] max-w-[260px] rounded-md bg-ink px-2.5 py-1.5 text-xs font-normal leading-snug text-white shadow-pop animate-in">
          {content}
        </div>, document.body)}
    </span>
  );
}
