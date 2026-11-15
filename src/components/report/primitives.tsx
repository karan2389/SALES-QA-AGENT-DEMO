"use client";
import type { ReactNode } from "react";
import { ArrowRightCircle } from "lucide-react";
import { SpeakerBadge } from "@/components/ui/Badges";
import { Card } from "@/components/ui/Card";
import { formatClock } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Quote } from "@/types";
import { useReport } from "./ctx";

export function Section({ id, n, title, desc, children, accent }: { id: string; n: number; title: string; desc?: ReactNode; children: ReactNode; accent?: boolean }) {
  return (
    <section id={id} data-section={n} className="scroll-mt-28" aria-labelledby={`${id}-h`}>
      <Card className={cn(accent && "border-l-4 border-l-teal-600")}>
        <div className="flex items-start gap-3 px-4 pb-3 pt-4">
          <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-soft text-xs font-bold text-brand">{n}</span>
          <div className="min-w-0"><h2 id={`${id}-h`} className="text-[15px] font-semibold text-ink">{title}</h2>{desc && <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>}</div>
        </div>
        <div className="px-4 pb-4">{children}</div>
      </Card>
    </section>
  );
}

export function JumpButton({ segments, label }: { segments: number[]; label?: string }) {
  const { jump } = useReport();
  if (!segments.length) return null;
  return (
    <button onClick={() => jump(segments)} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
      <ArrowRightCircle className="h-3.5 w-3.5" />{label ?? `Jump to transcript (segment ${segments.join(", ")})`}
    </button>
  );
}

export const mmss = (a: number, b: number) => `[${formatClock(a)}–${formatClock(b)}]`;

export function QuoteBlock({ q }: { q: Quote }) {
  return (
    <figure className="rounded-md border border-line bg-subtle/60 p-2.5">
      <div className="flex flex-wrap items-center gap-2 text-xs"><SpeakerBadge speaker={q.speaker} /><span className="tabular text-ink-muted">{mmss(q.start, q.end)} · segment {q.segments.join(", ")}</span></div>
      <blockquote className="mt-1.5 text-[13px] italic leading-relaxed text-ink-soft">“{q.text}”</blockquote>
      <figcaption className="mt-1.5"><JumpButton segments={q.segments} label="Jump to transcript" /></figcaption>
    </figure>
  );
}

export const Field = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
  <div className="min-w-0"><dt className="text-xs text-ink-muted">{label}</dt><dd className="mt-0.5 break-words text-[13px] font-medium text-ink">{children}</dd></div>
);

/** Hatched bar for N/A categories. */
export const hatch = "repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 4px, #f8fafc 4px, #f8fafc 8px)";
