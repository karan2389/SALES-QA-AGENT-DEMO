import Link from "next/link";
import { ScoreBar } from "@/components/charts/ScoreIndicators";
import { HorizontalBars } from "@/components/charts/HorizontalBars";
import { EvalStatusBadge, OutcomeBadge } from "@/components/ui/Badges";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { CATEGORY_BY_ID, CHECKLIST_BY_ID, OBJECTION_LABEL } from "@/config/rubric";
import { bandFor } from "@/config/ui";
import { formatDate, formatDuration } from "@/lib/dates";
import type { SalespersonProfile } from "@/types";
import { Lightbulb } from "lucide-react";

export function CategoryStrengthCard({ profile, which }: { profile: SalespersonProfile; which: "strongest" | "weakest" }) {
  const list = which === "strongest" ? profile.categories.slice(0, 3) : [...profile.categories].reverse().slice(0, 3);
  return (
    <Card className="h-full">
      <CardHeader title={which === "strongest" ? "Strongest categories" : "Weakest categories"} description={`Average category score across ${profile.evaluated} evaluated call${profile.evaluated === 1 ? "" : "s"}`} />
      <CardBody>
        {list.length === 0 ? <EmptyState title="No evaluated calls in this range" /> : (
          <HorizontalBars labelWidth={150} rows={list.map((c) => ({ id: c.id, label: CATEGORY_BY_ID[c.id].label, value: c.avg, display: String(Math.round(c.avg)), color: bandFor(c.avg).color }))} />
        )}
      </CardBody>
    </Card>
  );
}

export function MissedItemsCard({ profile }: { profile: SalespersonProfile }) {
  return (
    <Card className="h-full">
      <CardHeader title="Commonly missed checklist items" description="Share of evaluated calls where the item was not covered" />
      <CardBody>
        {profile.missedItems.length === 0 ? <EmptyState title="No missed items" description="Nothing was missed in the evaluated calls in this range." /> : (
          <HorizontalBars labelWidth={220} max={1} rows={profile.missedItems.map((m) => ({ id: m.itemId, label: CHECKLIST_BY_ID[m.itemId].label, value: m.missRate, display: `${Math.round(m.missRate * 100)}%`, sub: `n=${m.n}`, color: "#d58a0b" }))} />
        )}
      </CardBody>
    </Card>
  );
}

export function ObjectionGapsCard({ profile }: { profile: SalespersonProfile }) {
  return (
    <Card className="h-full">
      <CardHeader title="Recurring objection-handling gaps" description="Objections raised by prospects that were handled partially or poorly" />
      {profile.objectionGaps.length === 0 ? <CardBody><EmptyState title="No objection-handling gaps" description="All objections in this range were handled well." /></CardBody> : (
        <div className="overflow-x-auto"><table className="w-full text-[13px]">
          <thead className="border-y border-line bg-subtle/60 text-left text-xs font-medium text-ink-muted"><tr><th className="px-4 py-2">Objection</th><th className="px-4 py-2 text-right">Poorly handled</th><th className="px-4 py-2 text-right">Partially handled</th><th className="px-4 py-2 text-right">Raised</th></tr></thead>
          <tbody className="divide-y divide-line">{profile.objectionGaps.map((g) => (
            <tr key={g.category}><td className="px-4 py-2.5 font-medium">{OBJECTION_LABEL[g.category]}</td><td className="tabular px-4 py-2.5 text-right text-bad">{g.poor}</td><td className="tabular px-4 py-2.5 text-right text-warn">{g.partial}</td><td className="tabular px-4 py-2.5 text-right text-ink-muted">{g.total}</td></tr>
          ))}</tbody></table></div>
      )}
    </Card>
  );
}

export function CoachingCard({ profile }: { profile: SalespersonProfile }) {
  return (
    <Card>
      <CardHeader title="Coaching recommendations" description="Derived from the weakest categories and most-missed checklist items in this range" />
      <CardBody>
        {profile.coaching.length === 0 ? <EmptyState title="No coaching priorities" description={profile.evaluated ? "All category averages are 75 or above in this range." : "No evaluated calls in this range."} /> : (
          <ol className="grid gap-3 md:grid-cols-3">
            {profile.coaching.map((c, i) => (
              <li key={c.category} className="rounded-lg border border-line p-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-brand"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft tabular">{i + 1}</span>{CATEGORY_BY_ID[c.category].label}</p>
                <p className="mt-2 flex gap-1.5 text-[13px] text-ink"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />{c.action}</p>
                <p className="mt-1.5 text-xs text-ink-muted">{c.reason}</p>
              </li>
            ))}
          </ol>
        )}
        {profile.lowSample && profile.evaluated > 0 && <p className="mt-3 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">Based on only {profile.evaluated} evaluated call{profile.evaluated === 1 ? "" : "s"} — treat these as early signals rather than a pattern.</p>}
      </CardBody>
    </Card>
  );
}

export function RecentCallsCard({ profile }: { profile: SalespersonProfile }) {
  return (
    <Card>
      <CardHeader title="Recent calls" description="Most recent calls in the selected range" actions={<Link href={`/calls?salesperson=${profile.salesperson.id}`} className="text-[13px] font-medium text-brand hover:underline">View all in Call Explorer</Link>} />
      {profile.recent.length === 0 ? <EmptyState title="No calls in this range" /> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-[13px]">
          <thead className="border-y border-line bg-subtle/60 text-left text-xs font-medium text-ink-muted"><tr>{["Call", "Prospect", "Date", "Duration", "Outcome", "Quality", "Evaluation"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{profile.recent.map((r) => (
            <tr key={r.call.id} className="hover:bg-subtle/50">
              <td className="px-4 py-2.5"><Link href={`/calls/${r.call.id}`} className="font-medium text-brand hover:underline">{r.call.id}</Link></td>
              <td className="px-4 py-2.5">{r.call.prospectName}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{formatDate(r.call.callDate)}</td>
              <td className="tabular whitespace-nowrap px-4 py-2.5 text-ink-soft">{formatDuration(r.call.durationSeconds)}</td>
              <td className="px-4 py-2.5"><OutcomeBadge outcome={r.call.outcome} /></td>
              <td className="px-4 py-2.5"><ScoreBar score={r.overall} /></td>
              <td className="px-4 py-2.5"><EvalStatusBadge status={r.call.evaluationStatus} /></td>
            </tr>))}</tbody></table></div>
      )}
    </Card>
  );
}
