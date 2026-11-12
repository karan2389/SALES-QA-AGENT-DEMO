"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, FlaskConical, LogOut, Menu, RotateCcw, Settings } from "lucide-react";
import { Avatar, Badge } from "@/components/ui/Badges";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Checkbox } from "@/components/ui/Form";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { Popover } from "@/components/ui/Popover";
import { useToast } from "@/components/ui/Toast";
import { REVIEWER_NAME, REVIEWER_ROLE } from "@/config/ui";
import { useDataset } from "@/hooks/useDataset";
import { useDateRange } from "@/hooks/useDateRange";
import { REASON_LABEL, buildReviewQueue } from "@/lib/reviews";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { getPrototypeSettings, resetMockState, setPrototypeSettings } from "@/services";
import { useStoreVersion } from "@/hooks/useStoreVersion";
import { Breadcrumbs } from "./Breadcrumbs";
import { GlobalSearch } from "./GlobalSearch";

const DATE_ROUTES = ["/dashboard", "/team", "/analytics"];

function Notifications() {
  const { rows } = useDataset();
  const queue = buildReviewQueue(rows).filter((i) => i.priority !== "low");
  return (
    <Popover align="right" panelClassName="w-[340px]"
      trigger={({ toggle }) => (
        <button onClick={toggle} aria-label={`Notifications (${queue.length} items need attention)`} className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-subtle">
          <Bell className="h-[18px] w-[18px]" />
          {queue.length > 0 && <span className="tabular absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-bad px-1 text-[10px] font-semibold text-white">{queue.length}</span>}
        </button>
      )}>
      {({ close }) => (
        <div>
          <div className="border-b border-line px-3 py-2.5"><p className="text-[13px] font-semibold">Needs your attention</p><p className="text-xs text-ink-muted">Derived from current review queue</p></div>
          {queue.length === 0 ? <p className="px-3 py-6 text-center text-[13px] text-ink-muted">You&apos;re all caught up.</p> : (
            <ul className="max-h-[320px] divide-y divide-line overflow-y-auto">
              {queue.slice(0, 6).map((i) => (
                <li key={i.callId}>
                  <Link href={`/calls/${i.callId}`} onClick={close} className="block px-3 py-2.5 hover:bg-subtle">
                    <div className="flex items-center justify-between gap-2"><span className="text-[13px] font-medium">{i.callId}</span>
                      <Badge tone={i.priority === "high" ? "bad" : "warn"}>{i.priority}</Badge></div>
                    <p className="mt-0.5 text-xs text-ink-muted">{i.salesperson.name} · {formatShortDate(i.callDate)} · {REASON_LABEL[i.reasons[0]]}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/reviews" onClick={close} className="block border-t border-line bg-subtle px-3 py-2 text-center text-xs font-medium text-brand hover:bg-brand-soft">Open Review Centre ({queue.length})</Link>
        </div>
      )}
    </Popover>
  );
}

function PrototypeMenu() {
  const toast = useToast();
  useStoreVersion();
  const s = getPrototypeSettings();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Popover align="right" panelClassName="w-[320px]"
        trigger={({ toggle }) => (
          <button onClick={toggle} aria-label="Prototype settings"
            className="flex h-8 items-center gap-1.5 rounded-full border border-warn/30 bg-warn-soft px-2.5 text-xs font-medium text-warn hover:bg-warn-soft/70">
            <FlaskConical className="h-3.5 w-3.5" /><span className="hidden sm:inline">Prototype · mock data</span><span className="sm:hidden">Mock</span>
          </button>
        )}>
        <div className="p-3">
          <p className="text-[13px] font-semibold">Prototype controls</p>
          <p className="mb-3 mt-0.5 text-xs text-ink-muted">All figures are illustrative mock data. Reviews you save are stored only in this browser.</p>
          <div className="space-y-2.5">
            <Checkbox checked={s.slow} onChange={(v) => setPrototypeSettings({ slow: v })} label="Simulate slow loading" />
            <Checkbox checked={s.error} onChange={(v) => setPrototypeSettings({ error: v })} label="Simulate API error" />
          </div>
          <Button size="sm" className="mt-3 w-full justify-center" onClick={() => setConfirm(true)}><RotateCcw className="h-3.5 w-3.5" />Reset mock review state</Button>
        </div>
      </Popover>
      <Dialog open={confirm} title="Reset mock review state?" description="This removes all review actions, notes and score corrections you saved in this browser. The seeded mock data is not affected."
        confirmLabel="Reset" confirmVariant="danger" onClose={() => setConfirm(false)}
        onConfirm={() => { resetMockState(); setConfirm(false); toast({ tone: "success", title: "Mock review state reset" }); }} />
    </>
  );
}

function ProfileMenu() {
  const router = useRouter();
  return (
    <Popover align="right" panelClassName="w-[240px]"
      trigger={({ toggle }) => (
        <button onClick={toggle} aria-label="Account menu" className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-subtle">
          <Avatar name={REVIEWER_NAME} color="blue" size={30} />
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-[13px] font-medium text-ink">{REVIEWER_NAME}</span>
            <span className="block text-2xs text-ink-muted">{REVIEWER_ROLE}</span>
          </span>
        </button>
      )}>
      {({ close }) => (
        <div className="p-1.5">
          <div className="px-2.5 py-2"><p className="text-[13px] font-medium">{REVIEWER_NAME}</p><p className="text-xs text-ink-muted">{REVIEWER_ROLE} · demo user</p></div>
          <button onClick={() => { close(); router.push("/settings"); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-ink-soft hover:bg-subtle"><Settings className="h-4 w-4" />Settings</button>
          <button onClick={() => { close(); router.push("/dashboard"); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-ink-soft hover:bg-subtle"><LogOut className="h-4 w-4" />Back to Overview</button>
          <p className="px-2.5 pb-1.5 pt-2 text-2xs text-ink-muted">Authentication is not part of this prototype.</p>
        </div>
      )}
    </Popover>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { range, setRange } = useDateRange();
  const showDates = DATE_ROUTES.some((r) => pathname.startsWith(r));
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
        <button onClick={onMenu} aria-label="Open navigation" className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-subtle lg:hidden"><Menu className="h-5 w-5" /></button>
        <div className="hidden min-w-0 md:block md:flex-1"><Breadcrumbs /></div>
        <div className="flex-1 md:flex-none md:basis-[380px]"><GlobalSearch /></div>
        <div className={cn("flex items-center gap-1.5 sm:gap-2")}>
          {showDates && <div className="hidden sm:block"><DateRangePicker value={range} onChange={setRange} presets={["today", "yesterday", "last_7", "last_30", "this_month", "prev_month", "last_60", "all", "custom"]} /></div>}
          <PrototypeMenu />
          <Notifications />
          <ProfileMenu />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-1.5 md:hidden">
        <Breadcrumbs />
        {showDates && <div className="sm:hidden"><DateRangePicker compact value={range} onChange={setRange} /></div>}
      </div>
    </header>
  );
}
