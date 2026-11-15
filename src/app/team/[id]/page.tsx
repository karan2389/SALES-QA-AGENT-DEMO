"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowLeft, Lightbulb, SearchX } from "lucide-react";
import { CallsTable } from "@/components/calls/CallsTable";
import { HorizontalBars } from "@/components/charts/HorizontalBars";
import { ScoreTrendChart } from "@/components/charts/Charts";
import { Avatar, Badge, FlagCount, ScorePct } from "@/components/ui/Badges";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, QueryGate, Skeleton } from "@/components/ui/States";
import { TrendDelta } from "@/components/ui/TrendDelta";
import { ALL_CRITERIA, CATEGORY_BY_ID, FLAG_BY_ID, MIN_SAMPLE } from "@/config/mrv1";
import { scoreColor } from "@/config/ui";
import { useDataset } from "@/hooks/useDataset";
import { useDateRange } from "@/hooks/useDateRange";
import { formatDate, formatRange, rangeDays } from "@/lib/dates";
import { categoryAverages, inRangeRows, missedCriteria, neRate, recurringFlags, summarisePeople, topCoaching, trendClaim, trendSeries } from "@/lib/metrics";

export default function SalespersonPage() {
  const { id } = useParams<{ id: string }>();
  const { rows, salespeople, loading, error, reload, data } = useDataset();
  const { range } = useDateRange();
  const person = salespeople.find((s) => s.id === id);
  const mine = useMemo(() => rows.filter((r) => r.salesperson.id === id), [rows, id]);
  const inR = useMemo(() => inRangeRows(mine, range), [mine, range]);
  const sum = useMemo(() => (person ? summarisePeople(inR, [person])[0] : null), [inR, person]);
  const cats = useMemo(() => categoryAverages(inR).filter((c) => c.avg !== null).sort((a, b) => b.avg! - a.avg!), [inR]);
  const missed = useMemo(() => missedCriteria(inR).slice(0, 7), [inR]);
  const g = rangeDays(range) <= 14 ? "daily" : "weekly";
  const trend = useMemo(() => trendSeries(mine, range, g), [mine, range, g]);
  const claim = useMemo(() => trendClaim(mine, range), [mine, range]);
  const coaching = useMemo(() => topCoaching(inR), [inR]);
  const flags = useMemo(() => recurringFlags(inR), [inR]);
  const ne = neRate(inR);
  const catRows = (list: typeof cats) => list.map((c) => ({ id: c.id, label: `${c.id} ${CATEGORY_BY_ID[c.id].name}`, value: c.avg!, display: `${c.avg!.toFixed(0)}%`, sub: `n=${c.n}`, color: scoreColor(Math.max(35, c.avg!)) }));
  return (
    <>
      <Link href="/team" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" />Back to Sales Team</Link>
      <QueryGate loading={loading} error={error} hasData={!!data} onRetry={reload} skeleton={<Skeleton className="h-[500px]" />}>
        {!person || !sum ? <Card><EmptyState icon={<SearchX className="h-5 w-5" />} title="Salesperson not found" action={<Link href="/team" className="text-[13px] font-medium text-brand hover:underline">Open Sales Team</Link>} /></Card> : (
          <div className="space-y-4">
            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5"><Avatar name={person.name} color={person.avatar} size={52} /><div><h1 className="text-xl font-semibold">{person.name}</h1><p className="text-[13px] text-ink-muted">{person.role} · {person.team}</p><p className="text-xs text-ink-muted">Joined {formatDate(person.joinedOn)}</p></div></div>
                <div className="flex flex-col items-end gap-1 text-xs text-ink-muted"><Badge tone="warn">Illustrative mock data</Badge><span>Date range: {formatRange(range)} (change in top bar)</span></div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-5">
                <div><dt className="text-xs text-ink-muted">Calls evaluated</dt><dd className="tabular mt-0.5 text-xl font-semibold">{sum.evaluated}<span className="ml-1 text-xs font-normal text-ink-muted">of {sum.calls}</span></dd></div>
                <div><dt className="text-xs text-ink-muted">Avg sales-stage</dt><dd className="mt-0.5 text-xl"><ScorePct pct={sum.stage} provisional className="text-xl" digits={1} /><span className="ml-1 text-xs text-ink-muted">n={sum.evaluated}</span></dd></div>
                <div><dt className="text-xs text-ink-muted">Avg psychology</dt><dd className="mt-0.5 text-xl"><ScorePct pct={sum.psych} provisional className="text-xl" digits={1} /><span className="ml-1 text-xs text-ink-muted">n={sum.evaluated}</span></dd></div>
                <div><dt className="text-xs text-ink-muted">Flags</dt><dd className="mt-1"><FlagCount count={sum.flags} severity={sum.topSeverity} /></dd></div>
                <div><dt className="text-xs text-ink-muted">NE rate</dt><dd className="tabular mt-0.5 text-xl font-semibold">{ne === null ? "—" : `${(ne * 100).toFixed(1)}%`}</dd></div>
              </dl>
              {sum.lowSample ? <p className="mt-3 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn"><strong>Low sample:</strong> fewer than {MIN_SAMPLE} evaluated calls. Averages are indicative only; no trend is claimed and this person should not be compared with others.</p>
                : <p className="mt-3 text-xs text-ink-muted">Change in sales-stage % vs previous range: <TrendDelta value={claim} unit=" pts" neutral /></p>}
            </Card>
            <Card><CardHeader title="Score trend" description={`Per ${g === "daily" ? "day" : "week"} · evaluated calls · provisional`} />
              <CardBody>{trend.some((t) => t.stage !== null) ? <ScoreTrendChart data={trend} xLabel={g === "daily" ? "Day" : "Week starting (Mon)"} height={230} /> : <EmptyState title="No evaluated calls in this range" />}</CardBody></Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="h-full"><CardHeader title="Strongest categories" description={`C01–C19 average across ${sum.evaluated} evaluated calls`} /><CardBody>{cats.length ? <HorizontalBars labelWidth={190} rows={catRows(cats.slice(0, 3))} /> : <EmptyState title="No evaluated calls" />}</CardBody></Card>
              <Card className="h-full"><CardHeader title="Weakest categories" description="Lowest average category percentages" /><CardBody>{cats.length ? <HorizontalBars labelWidth={190} rows={catRows([...cats].reverse().slice(0, 3))} /> : <EmptyState title="No evaluated calls" />}</CardBody></Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="h-full"><CardHeader title="Most frequently missed criteria" description="Scored 0–1 — “n of N calls” (criteria scored on those calls only)" />
                <CardBody>{missed.length ? <ul className="space-y-2.5">{missed.map((m) => <li key={m.id} className="flex items-center justify-between gap-3 text-[13px]"><span className="min-w-0 truncate"><span className="tabular mr-1.5 text-xs text-ink-muted">{m.id}</span>{ALL_CRITERIA.find((c) => c.id === m.id)!.name}</span><span className="tabular shrink-0 font-semibold text-ink">{m.missed} of {m.of} calls</span></li>)}</ul> : <EmptyState title="No missed criteria" />}</CardBody></Card>
              <Card className="h-full"><CardHeader title="Recurring flags" description="Critical flags not dismissed by a human" />
                <CardBody>{flags.length ? <ul className="space-y-2">{flags.map((f) => <li key={f.id} className="flex items-center justify-between text-[13px]"><span>{FLAG_BY_ID[f.id].label}</span><Badge tone="bad">{f.count}× · {f.confirmed} confirmed</Badge></li>)}</ul> : <p className="text-[13px] text-ink-muted">No flags in this range.</p>}</CardBody></Card>
            </div>
            <Card><CardHeader title="Coaching priorities" description="Top recurring priorities aggregated from the individual call reports" />
              <CardBody>{coaching.length ? <ol className="grid gap-3 md:grid-cols-3">{coaching.map((c, i) => <li key={c.categoryId} className="rounded-lg border border-line p-3"><p className="flex items-center gap-2 text-xs font-semibold text-brand"><span className="tabular flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft">{i + 1}</span>{c.categoryId} {CATEGORY_BY_ID[c.categoryId].name}</p><p className="mt-2 flex gap-1.5 text-[13px]"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />{c.action}</p><p className="mt-1.5 text-xs text-ink-muted">Priority in {c.calls} of {sum.evaluated} evaluated calls</p></li>)}</ol> : <EmptyState title="No coaching priorities in this range" />}
                {sum.lowSample && sum.evaluated > 0 && <p className="mt-3 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">Based on only {sum.evaluated} evaluated call{sum.evaluated === 1 ? "" : "s"} — treat as early signals.</p>}</CardBody></Card>
            <Card><CardHeader title="Recent calls" description="Most recent calls in the selected range" actions={<Link href={`/calls?salesperson=${person.id}`} className="text-[13px] font-medium text-brand hover:underline">View all in Call Explorer</Link>} />
              {inR.length ? <CallsTable rows={inR.slice(0, 6)} /> : <EmptyState title="No calls in this range" />}</Card>
          </div>
        )}
      </QueryGate>
    </>
  );
}
