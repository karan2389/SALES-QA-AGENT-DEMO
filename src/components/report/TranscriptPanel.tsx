"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, FileX2, X } from "lucide-react";
import { SpeakerBadge } from "@/components/ui/Badges";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/Form";
import { formatClock } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TranscriptData } from "@/types";

export function TranscriptPanel({ transcript, highlight, speakerUncertain, onClear, onClose }: {
  transcript: TranscriptData | null; highlight: { segments: number[]; nonce: number } | null; speakerUncertain: boolean; onClear: () => void; onClose?: () => void;
}) {
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const hl = useMemo(() => new Set(highlight?.segments ?? []), [highlight]);
  useEffect(() => {
    if (!highlight?.segments.length) return;
    const el = box.current?.querySelector<HTMLElement>(`[data-seg="${highlight.segments[0]}"]`);
    if (el && box.current) box.current.scrollTo({ top: Math.max(0, el.offsetTop - box.current.offsetTop - 70), behavior: "smooth" });
  }, [highlight]);
  const segs = transcript?.segments ?? [];
  const needle = q.trim().toLowerCase();
  const visible = needle ? segs.filter((s) => s.text.toLowerCase().includes(needle)) : segs;

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <div><h2 className="text-[13px] font-semibold">Transcript</h2><p className="text-2xs text-ink-muted">{transcript ? `${transcript.source} · mock` : "Not available"}</p></div>
        {onClose && <button onClick={onClose} aria-label="Close transcript" className="rounded p-1 text-ink-muted hover:bg-subtle"><X className="h-4 w-4" /></button>}
      </div>
      {!transcript ? <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-[13px] text-ink-muted"><FileX2 className="mb-2 h-5 w-5" />No transcript is available for this call.</div> : (
        <>
          {speakerUncertain && <p role="alert" className="flex items-start gap-1.5 border-b border-warn/20 bg-warn-soft px-3 py-2 text-xs text-warn"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Speaker attribution is uncertain in parts of this transcript. Labels are not guessed.</p>}
          <div className="flex items-center gap-2 border-b border-line px-3 py-2"><SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transcript…" aria-label="Search transcript" className="flex-1" />
            {highlight && <button onClick={onClear} className="whitespace-nowrap text-xs font-medium text-brand hover:underline">Clear highlight</button>}</div>
          <div ref={box} className="min-h-0 flex-1 overflow-y-auto scroll-thin" role="log" aria-label="Call transcript">
            {visible.length === 0 ? <p className="p-4 text-[13px] text-ink-muted">No segments match “{q}”.</p> : (
              <ol className="divide-y divide-line/70">
                {visible.map((s) => (
                  <li key={s.n} data-seg={s.n} className={cn("cv-auto px-3 py-2.5 transition-colors", hl.has(s.n) && "bg-brand-soft ring-2 ring-inset ring-brand/50")}>
                    <div className="flex flex-wrap items-center gap-2 text-xs"><span className="tabular font-semibold text-ink-muted">#{s.n}</span><span className="tabular text-brand">[{formatClock(s.start)}–{formatClock(s.end)}]</span><SpeakerBadge speaker={s.speaker} /></div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink">{s.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
