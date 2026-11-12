"use client";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, FileX2, HelpCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Checkbox, SearchInput } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/States";
import { Tooltip } from "@/components/ui/Tooltip";
import { CATEGORY_BY_ID } from "@/config/rubric";
import { LANGUAGE_LABEL } from "@/config/ui";
import { formatClock } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CategoryId, Evidence, SpeakerLabel, Transcript } from "@/types";

export interface TranscriptHandle { jumpTo: (segmentId: string) => void }

const SPEAKER: Record<SpeakerLabel, { label: string; cls: string }> = {
  salesperson: { label: "Salesperson", cls: "bg-brand-soft text-brand" },
  prospect: { label: "Prospect", cls: "bg-subtle text-ink-soft" },
  uncertain: { label: "Uncertain speaker", cls: "bg-warn-soft text-warn" },
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${esc(query.trim())})`, "gi"));
  return <>{parts.map((p, i) => (p.toLowerCase() === query.trim().toLowerCase() ? <mark key={i} className="rounded bg-yellow-200 px-0.5 text-ink">{p}</mark> : <span key={i}>{p}</span>))}</>;
}

export const TranscriptViewer = forwardRef<TranscriptHandle, {
  transcript: Transcript | null; evidence: Evidence[]; highlightCategory: CategoryId | null; onClearHighlight: () => void;
}>(function TranscriptViewer({ transcript, evidence, highlightCategory, onClearHighlight }, ref) {
  const [query, setQuery] = useState("");
  const [matchIdx, setMatchIdx] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [keyOnly, setKeyOnly] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);

  const evidenceBySeg = useMemo(() => {
    const m = new Map<string, Evidence[]>();
    for (const e of evidence) m.set(e.segmentId, [...(m.get(e.segmentId) ?? []), e]);
    return m;
  }, [evidence]);
  const segments = useMemo(() => transcript?.segments ?? [], [transcript]);
  const matches = useMemo(() => (query.trim() ? segments.filter((s) => s.text.toLowerCase().includes(query.trim().toLowerCase())).map((s) => s.id) : []), [segments, query]);
  const visible = keyOnly ? segments.filter((s) => evidenceBySeg.has(s.id) || s.category === highlightCategory) : segments;

  const scrollToSeg = (id: string, page = false) => {
    if (page) card.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const el = scroller.current?.querySelector<HTMLElement>(`[data-seg="${id}"]`);
    if (el && scroller.current) scroller.current.scrollTo({ top: Math.max(0, el.offsetTop - scroller.current.offsetTop - 60), behavior: "smooth" });
  };

  useImperativeHandle(ref, () => ({
    jumpTo: (id) => { setKeyOnly(false); setActiveId(id); setTimeout(() => scrollToSeg(id, true), 30); },
  }));

  useEffect(() => { setMatchIdx(0); }, [query]);
  useEffect(() => { if (matches.length) { const id = matches[Math.min(matchIdx, matches.length - 1)]; setActiveId(id); scrollToSeg(id); } }, [matchIdx, matches]);
  useEffect(() => {
    if (!highlightCategory) return;
    const seg = segments.find((s) => s.category === highlightCategory);
    if (seg) { setActiveId(seg.id); setTimeout(() => scrollToSeg(seg.id, true), 30); }
  }, [highlightCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = (d: 1 | -1) => setMatchIdx((i) => (matches.length ? (i + d + matches.length) % matches.length : 0));

  if (!transcript || transcript.transcriptionStatus !== "completed") {
    const failed = transcript?.transcriptionStatus === "failed";
    return (
      <Card><CardHeader title="Transcript" />
        <EmptyState icon={<FileX2 className="h-5 w-5" />} title={failed ? "Transcription failed" : "Transcript is still processing"}
          description={failed ? "No transcript is available for this call, so there is no evidence to inspect." : "The recording is being transcribed. Check back shortly."} /></Card>
    );
  }

  return (
    <div ref={card} className="scroll-mt-20">
      <Card>
        <CardHeader title="Transcript" description={<>{LANGUAGE_LABEL[transcript.language]} · mock transcript · mean transcription confidence {Math.round(transcript.transcriptionConfidence * 100)}%</>}
          actions={<Checkbox checked={keyOnly} onChange={setKeyOnly} label="Key moments only" />} />
        <div className="flex flex-wrap items-center gap-2 border-y border-line bg-subtle/50 px-4 py-2.5">
          <SearchInput className="w-full sm:w-[280px]" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search within transcript…" aria-label="Search within transcript"
            onKeyDown={(e) => { if (e.key === "Enter") step(e.shiftKey ? -1 : 1); }} />
          {query.trim() && (
            <div className="flex items-center gap-1.5 text-xs text-ink-muted" aria-live="polite">
              <span className="tabular">{matches.length ? `${Math.min(matchIdx, matches.length - 1) + 1} of ${matches.length}` : "No matches"}</span>
              <Button size="icon" variant="ghost" aria-label="Previous match" disabled={!matches.length} onClick={() => step(-1)}><ChevronUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Next match" disabled={!matches.length} onClick={() => step(1)}><ChevronDown className="h-4 w-4" /></Button>
            </div>
          )}
          {highlightCategory && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand-soft py-0.5 pl-2.5 pr-1 text-xs font-medium text-brand">
              Highlighting: {CATEGORY_BY_ID[highlightCategory].label}
              <button onClick={onClearHighlight} aria-label="Clear category highlight" className="rounded-full p-0.5 hover:bg-brand/15"><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
        <div ref={scroller} className="relative max-h-[560px] overflow-y-auto scroll-thin" role="log" aria-label="Call transcript">
          {visible.length === 0 ? <EmptyState title="No key moments" description="This call has no evidence-linked segments." /> : (
            <ol className="divide-y divide-line/70">
              {visible.map((s) => {
                const ev = evidenceBySeg.get(s.id);
                const isActive = activeId === s.id;
                const catMatch = highlightCategory !== null && s.category === highlightCategory;
                const kind = ev?.[0]?.kind;
                const sp = SPEAKER[s.speaker];
                return (
                  <li key={s.id} data-seg={s.id}
                    className={cn("grid grid-cols-[52px_1fr] gap-x-3 border-l-[3px] px-4 py-2.5 transition-colors sm:grid-cols-[52px_128px_1fr]",
                      kind === "strength" ? "border-l-good bg-good-soft/40" : kind === "gap" ? "border-l-warn bg-warn-soft/50" : "border-l-transparent",
                      catMatch && "bg-brand-soft/60", isActive && "ring-2 ring-inset ring-brand/60")}>
                    <button onClick={() => { setActiveId(s.id); }} className="tabular h-fit pt-0.5 text-left text-xs font-medium text-brand hover:underline" aria-label={`Timestamp ${formatClock(s.timestamp)}`}>{formatClock(s.timestamp)}</button>
                    <div className="col-start-2 mb-1 flex items-start sm:col-start-2 sm:mb-0">
                      <Tooltip content={`Speaker confidence ${Math.round(s.speakerConfidence * 100)}% (mock label)`}>
                        <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-semibold", sp.cls)}>{s.speaker === "uncertain" && <HelpCircle className="h-3 w-3" />}{sp.label}</span>
                      </Tooltip>
                    </div>
                    <div className="col-start-2 text-[13px] leading-relaxed text-ink sm:col-start-3">
                      <Highlighted text={s.text} query={query} />
                      {ev && (
                        <span className="mt-1.5 flex flex-wrap gap-1.5">
                          {ev.map((e) => <Badge key={e.id} tone={e.kind === "strength" ? "good" : "warn"}>{e.kind === "strength" ? "Strength" : "Gap"} · {CATEGORY_BY_ID[e.category].short}</Badge>)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        <p className="border-t border-line px-4 py-2 text-2xs text-ink-muted">Mock transcript for demonstration. Speaker labels are illustrative — the prototype does not perform speaker diarization; low-confidence attributions show as “Uncertain speaker”.</p>
      </Card>
    </div>
  );
});
