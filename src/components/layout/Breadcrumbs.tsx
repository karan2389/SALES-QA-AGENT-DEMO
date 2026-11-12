"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useDataset } from "@/hooks/useDataset";
import { ROUTE_LABEL } from "./nav";

export function Breadcrumbs() {
  const pathname = usePathname();
  const { salespeople } = useDataset();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((p, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    let label = ROUTE_LABEL[p] ?? decodeURIComponent(p);
    if (parts[0] === "team" && i === 1) label = salespeople.find((s) => s.id === p)?.name ?? p;
    return { href, label };
  });
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-[13px]">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" />}
            {i === crumbs.length - 1
              ? <span className="truncate font-medium text-ink" aria-current="page">{c.label}</span>
              : <Link href={c.href} className="truncate text-ink-muted hover:text-ink">{c.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
