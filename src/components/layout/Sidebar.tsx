"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Phone, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useDataset } from "@/hooks/useDataset";
import { buildReviewQueue } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import { MAIN_NAV, SECONDARY_NAV, type NavItem } from "./nav";

function NavLink({ item, collapsed, badge, onNavigate }: { item: NavItem; collapsed: boolean; badge?: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.match(pathname);
  const Icon = item.icon;
  const link = (
    <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
      className={cn("group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium transition-colors",
        active ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-subtle hover:text-ink", collapsed && "justify-center px-0")}>
      {active && <span className="absolute -left-3 top-1.5 h-6 w-[3px] rounded-r bg-brand" aria-hidden />}
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && badge ? <span className="tabular ml-auto rounded-full bg-warn-soft px-1.5 text-2xs font-semibold text-warn">{badge}</span> : null}
      {collapsed && badge ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warn" /> : null}
    </Link>
  );
  return collapsed ? <Tooltip content={item.label} side="right" className="w-full">{link}</Tooltip> : link;
}

export function Sidebar({ collapsed, onToggle, mobile, onClose }: { collapsed: boolean; onToggle?: () => void; mobile?: boolean; onClose?: () => void }) {
  const { rows } = useDataset();
  const reviewCount = buildReviewQueue(rows).filter((i) => i.priority !== "low").length;
  const c = collapsed && !mobile;
  return (
    <aside className={cn("flex h-full flex-col border-r border-line bg-surface", c ? "w-[64px]" : "w-[236px]")} aria-label="Primary">
      <div className={cn("flex h-14 shrink-0 items-center border-b border-line px-3", c ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" onClick={onClose} className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white"><Phone className="h-4 w-4" /></span>
          {!c && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold text-ink">FlexiFunnels</span>
              <span className="block truncate text-2xs text-ink-muted">Call Intelligence</span>
            </span>
          )}
        </Link>
        {mobile && <button onClick={onClose} aria-label="Close navigation" className="rounded p-1.5 text-ink-muted hover:bg-subtle"><X className="h-4 w-4" /></button>}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3 scroll-thin">
        <ul className="space-y-0.5">
          {MAIN_NAV.map((i) => <li key={i.href}><NavLink item={i} collapsed={c} onNavigate={onClose} badge={i.href === "/reviews" ? reviewCount : undefined} /></li>)}
        </ul>
        <p className={cn("mb-1 mt-5 px-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-muted", c && "sr-only")}>Workspace</p>
        {c && <div className="my-3 border-t border-line" />}
        <ul className="space-y-0.5">
          {SECONDARY_NAV.map((i) => <li key={i.href}><NavLink item={i} collapsed={c} onNavigate={onClose} /></li>)}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        {!c && (
          <div className="mb-2 rounded-md bg-warn-soft px-2.5 py-2 text-2xs leading-snug text-warn">
            <span className="font-semibold">Prototype build.</span> Illustrative mock data — not live FlexiFunnels figures.
          </div>
        )}
        {!mobile && (
          <button onClick={onToggle} aria-label={c ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs font-medium text-ink-muted hover:bg-subtle hover:text-ink", c && "justify-center")}>
            {c ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" />Collapse</>}
          </button>
        )}
      </div>
    </aside>
  );
}
