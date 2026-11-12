import { bandFor } from "@/config/ui";
import { cn } from "@/lib/utils";

/** Small inline bar + value for tables. */
export function ScoreBar({ score, className, showBand }: { score: number | null; className?: string; showBand?: boolean }) {
  if (score === null) return <span className="text-ink-muted">—</span>;
  const band = bandFor(score);
  return (
    <div className={cn("flex items-center gap-2", className)} title={`${Math.round(score)} · ${band.label}`}>
      <span className="tabular w-7 text-right text-[13px] font-semibold text-ink">{Math.round(score)}</span>
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full" style={{ width: `${Math.max(2, score)}%`, background: band.color }} /></div>
      {showBand && <span className="text-xs text-ink-muted">{band.label}</span>}
    </div>
  );
}

/** Circular overall score gauge. */
export function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const band = bandFor(score);
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Overall quality score ${Math.round(score)} out of 100, ${band.label}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8ecf1" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={band.color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset 500ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-[34px] font-semibold leading-none text-ink">{Math.round(score)}</span>
        <span className="mt-1 text-2xs text-ink-muted">out of 100</span>
      </div>
    </div>
  );
}
