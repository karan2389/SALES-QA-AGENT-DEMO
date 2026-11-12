import { MOCK_NOW_ISO } from "@/config/ui";
import type { DatePreset, DateRangeValue, Granularity } from "@/types";

/** All dates are handled in IST (UTC+5:30) so SSR, tests and every viewer agree. */
const IST_OFFSET = 330 * 60_000;
const DAY = 86_400_000;

export const NOW = new Date(MOCK_NOW_ISO).getTime();

export const istDayStart = (ts: number) => Math.floor((ts + IST_OFFSET) / DAY) * DAY - IST_OFFSET;
export const istDayEnd = (ts: number) => istDayStart(ts) + DAY - 1;
const istParts = (ts: number) => {
  const d = new Date(ts + IST_OFFSET);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay() };
};
const istMonthStart = (y: number, m: number) => Date.UTC(y, m, 1) - IST_OFFSET;

export function resolvePreset(preset: DatePreset, now = NOW): DateRangeValue {
  const today = istDayStart(now);
  const { y, m } = istParts(now);
  switch (preset) {
    case "today": return { preset, from: today, to: istDayEnd(now) };
    case "yesterday": return { preset, from: today - DAY, to: today - 1 };
    case "last_7": return { preset, from: today - 6 * DAY, to: istDayEnd(now) };
    case "last_30": return { preset, from: today - 29 * DAY, to: istDayEnd(now) };
    case "last_60": return { preset, from: today - 59 * DAY, to: istDayEnd(now) };
    case "this_month": return { preset, from: istMonthStart(y, m), to: istDayEnd(now) };
    case "prev_month": return { preset, from: istMonthStart(y, m - 1), to: istMonthStart(y, m) - 1 };
    case "all": return { preset, from: 0, to: istDayEnd(now) };
    default: return { preset: "custom", from: today - 29 * DAY, to: istDayEnd(now) };
  }
}

export function customRange(fromKey: string, toKey: string): DateRangeValue {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  const [a, b] = from <= to ? [from, to] : [to, from];
  return { preset: "custom", from: a, to: istDayEnd(b) };
}

/** "YYYY-MM-DD" in IST. */
export function dateKey(ts: number): string {
  const { y, m, d } = istParts(ts);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
export function parseDateKey(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) - IST_OFFSET;
}

/** The immediately preceding range of equal length (used for "vs previous period"). */
export function previousRange(r: DateRangeValue): DateRangeValue {
  if (r.preset === "all") return { ...r, from: 0, to: 0 };
  const len = r.to - r.from + 1;
  return { preset: "custom", from: r.from - len, to: r.from - 1 };
}

export const inRange = (ts: number, r: DateRangeValue) => ts >= r.from && ts <= r.to;
export const rangeDays = (r: DateRangeValue) => Math.max(1, Math.round((r.to - r.from + 1) / DAY));

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...opts });
const fDate = fmt({ day: "2-digit", month: "short", year: "numeric" });
const fShort = fmt({ day: "2-digit", month: "short" });
const fTime = fmt({ hour: "2-digit", minute: "2-digit", hour12: true });
const fMonth = fmt({ month: "short", year: "2-digit" });

export const formatDate = (iso: string | number) => fDate.format(new Date(iso));
export const formatShortDate = (iso: string | number) => fShort.format(new Date(iso));
export const formatTime = (iso: string | number) => fTime.format(new Date(iso)).toUpperCase();
export const formatDateTime = (iso: string | number) => `${formatDate(iso)}, ${formatTime(iso)}`;

export function formatRange(r: DateRangeValue): string {
  if (r.preset === "all") return "All time";
  return `${formatShortDate(r.from)} – ${fDate.format(new Date(r.to))}`;
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
export function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Bucket key + label for trend series. Weeks start on Monday (IST). */
export function bucketOf(ts: number, g: Granularity): { key: string; label: string; start: number } {
  const dayStart = istDayStart(ts);
  if (g === "daily") return { key: dateKey(dayStart), label: fShort.format(new Date(dayStart)), start: dayStart };
  if (g === "weekly") {
    const dow = (istParts(ts).dow + 6) % 7;
    const start = dayStart - dow * DAY;
    return { key: dateKey(start), label: `Wk ${fShort.format(new Date(start))}`, start };
  }
  const { y, m } = istParts(ts);
  const start = istMonthStart(y, m);
  return { key: dateKey(start), label: fMonth.format(new Date(start)), start };
}

export function nextBucketStart(start: number, g: Granularity): number {
  if (g === "daily") return start + DAY;
  if (g === "weekly") return start + 7 * DAY;
  const { y, m } = istParts(start);
  return istMonthStart(y, m + 1);
}

export function timeAgoLabel(iso: string): string {
  const diff = NOW - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}
