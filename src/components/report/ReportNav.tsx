"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const SECTIONS = ["Call Details", "Overall Performance", "Executive Summary", "Prospect Profile", "Category-wise Scorecard", "Detailed Criterion Evaluation", "Sales Psychology & Conduct", "Objection Analysis", "What Went Well", "Missed Opportunities", "Critical Flags", "Personal Coaching Plan", "Final Coaching Note", "Human Review"];

export function ReportNav({ only }: { only?: number[] }) {
  const [active, setActive] = useState(1);
  const list = SECTIONS.map((t, i) => ({ n: i + 1, t })).filter((s) => !only || only.includes(s.n));
  useEffect(() => {
    const main = document.getElementById("main");
    const obs = new IntersectionObserver((es) => { const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (v) setActive(Number((v.target as HTMLElement).dataset.section)); }, { root: main, rootMargin: "-10% 0px -75% 0px" });
    document.querySelectorAll("[data-section]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  const go = (n: number) => document.getElementById(`s${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <>
      <nav aria-label="On this page" className="hidden lg:block">
        <p className="mb-2 px-2 text-2xs font-semibold uppercase tracking-wider text-ink-muted">On this page</p>
        <ol className="space-y-0.5">{list.map((s) => (
          <li key={s.n}><button onClick={() => go(s.n)} aria-current={active === s.n ? "true" : undefined} className={cn("flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-subtle", active === s.n ? "bg-brand-soft font-semibold text-brand" : "text-ink-soft")}><span className="tabular w-4 shrink-0 text-ink-muted">{s.n}</span>{s.t}</button></li>))}</ol>
      </nav>
      <label className="block lg:hidden"><span className="sr-only">Jump to section</span>
        <select aria-label="Jump to section" onChange={(e) => go(Number(e.target.value))} defaultValue="" className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm"><option value="" disabled>Jump to section…</option>{list.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.t}</option>)}</select></label>
    </>
  );
}
