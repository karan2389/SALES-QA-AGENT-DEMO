"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface DialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger" | "success";
  confirmDisabled?: boolean;
  loading?: boolean;
  onConfirm?: () => void;
}

export function Dialog({ open, title, description, onClose, children, confirmLabel = "Confirm", confirmVariant = "primary", confirmDisabled, loading, onConfirm }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("textarea, input, button[data-primary]")?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = overflow; prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-t-xl border border-line bg-surface shadow-pop animate-in sm:rounded-xl">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-ink-muted">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
        {children && <div className="px-5 pt-4">{children}</div>}
        <div className="flex justify-end gap-2 px-5 py-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button data-primary variant={confirmVariant === "danger" ? "danger" : confirmVariant} disabled={confirmDisabled || loading} onClick={onConfirm}>
            {loading ? "Saving…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
