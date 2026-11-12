import { DURATION_BUCKETS, EVAL_LABEL, LANGUAGE_LABEL, OUTCOME_BY_ID, REVIEW_LABEL } from "@/config/ui";
import { inRange, resolvePreset } from "@/lib/dates";
import type { CallRow, DateRangeValue, EvaluationStatus, Language, Outcome, ReviewStatus } from "@/types";

export type RangeTuple = [number, number];
export type DurationId = (typeof DURATION_BUCKETS)[number]["id"];

export interface CallFilters {
  q: string;
  date: DateRangeValue;
  salespersonIds: string[];
  outcomes: Outcome[];
  quality: RangeTuple;
  evalStatuses: EvaluationStatus[];
  reviewStatuses: ReviewStatus[];
  languages: Language[];
  duration: DurationId;
  objection: RangeTuple;
  discovery: RangeTuple;
}

export const FULL_RANGE: RangeTuple = [0, 100];
export const defaultFilters = (): CallFilters => ({
  q: "", date: resolvePreset("all"), salespersonIds: [], outcomes: [], quality: [...FULL_RANGE], evalStatuses: [], reviewStatuses: [],
  languages: [], duration: "any", objection: [...FULL_RANGE], discovery: [...FULL_RANGE],
});

const isFull = (r: RangeTuple) => r[0] <= 0 && r[1] >= 100;
const digits = (s: string) => s.replace(/\D/g, "");

function matchesSearch(r: CallRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [r.call.id, r.call.callyzerCallId, r.salesperson.name, r.call.prospectName, r.call.phoneNumber, EVAL_LABEL[r.call.evaluationStatus], r.call.evaluationStatus.replace("_", " ")]
    .join(" | ").toLowerCase();
  if (hay.includes(needle)) return true;
  const d = digits(needle);
  return d.length >= 3 && digits(r.call.phoneNumber).includes(d);
}

const inScore = (v: number | null, r: RangeTuple) => (isFull(r) ? true : v !== null && v >= r[0] && v <= r[1]);

export function applyFilters(rows: CallRow[], f: CallFilters): CallRow[] {
  const dur = DURATION_BUCKETS.find((d) => d.id === f.duration)!;
  return rows.filter((r) =>
    matchesSearch(r, f.q) &&
    inRange(r.ts, f.date) &&
    (!f.salespersonIds.length || f.salespersonIds.includes(r.salesperson.id)) &&
    (!f.outcomes.length || f.outcomes.includes(r.call.outcome)) &&
    (!f.evalStatuses.length || f.evalStatuses.includes(r.call.evaluationStatus)) &&
    (!f.reviewStatuses.length || f.reviewStatuses.includes(r.call.reviewStatus)) &&
    (!f.languages.length || f.languages.includes(r.call.language)) &&
    r.call.durationSeconds >= dur.min && r.call.durationSeconds < dur.max &&
    inScore(r.overall, f.quality) && inScore(r.objection, f.objection) && inScore(r.discovery, f.discovery),
  );
}

export type SortKey = "date" | "duration" | "quality" | "objection" | "discovery" | "id" | "prospect" | "salesperson";
export interface SortState { key: SortKey; dir: "asc" | "desc" }

export const SORT_PRESETS: { id: string; label: string; sort: SortState }[] = [
  { id: "newest", label: "Newest first", sort: { key: "date", dir: "desc" } },
  { id: "oldest", label: "Oldest first", sort: { key: "date", dir: "asc" } },
  { id: "q_desc", label: "Highest quality score", sort: { key: "quality", dir: "desc" } },
  { id: "q_asc", label: "Lowest quality score", sort: { key: "quality", dir: "asc" } },
  { id: "d_desc", label: "Longest duration", sort: { key: "duration", dir: "desc" } },
  { id: "d_asc", label: "Shortest duration", sort: { key: "duration", dir: "asc" } },
  { id: "o_desc", label: "Highest objection-handling score", sort: { key: "objection", dir: "desc" } },
  { id: "disc_asc", label: "Lowest discovery score", sort: { key: "discovery", dir: "asc" } },
];

export const presetIdFor = (s: SortState) => SORT_PRESETS.find((p) => p.sort.key === s.key && p.sort.dir === s.dir)?.id ?? "custom";

export function sortRows(rows: CallRow[], s: SortState): CallRow[] {
  const sign = s.dir === "asc" ? 1 : -1;
  const num = (r: CallRow): number | null =>
    s.key === "date" ? r.ts : s.key === "duration" ? r.call.durationSeconds : s.key === "quality" ? r.overall
    : s.key === "objection" ? r.objection : s.key === "discovery" ? r.discovery : null;
  const str = (r: CallRow) => (s.key === "id" ? r.call.id : s.key === "prospect" ? r.call.prospectName : r.salesperson.name);
  return [...rows].sort((a, b) => {
    if (["id", "prospect", "salesperson"].includes(s.key)) return sign * str(a).localeCompare(str(b), undefined, { numeric: true });
    const x = num(a), y = num(b);
    if (x === null && y === null) return b.ts - a.ts;
    if (x === null) return 1; // unscored calls always last
    if (y === null) return -1;
    return sign * (x - y) || b.ts - a.ts;
  });
}

export const defaultDirFor = (k: SortKey): "asc" | "desc" => (["id", "prospect", "salesperson"].includes(k) ? "asc" : "desc");

export interface FilterChip { id: string; label: string }

export function activeChips(f: CallFilters, salespeopleNames: Record<string, string>): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.q.trim()) chips.push({ id: "q", label: `Search: “${f.q.trim()}”` });
  if (f.date.preset !== "all") chips.push({ id: "date", label: "Date: " + (f.date.preset === "custom" ? "Custom range" : f.date.preset.replace("_", " ")) });
  if (f.salespersonIds.length) chips.push({ id: "salespersonIds", label: "Salesperson: " + f.salespersonIds.map((i) => salespeopleNames[i] ?? i).join(", ") });
  if (f.outcomes.length) chips.push({ id: "outcomes", label: "Outcome: " + f.outcomes.map((o) => OUTCOME_BY_ID[o].label).join(", ") });
  if (!isFull(f.quality)) chips.push({ id: "quality", label: `Quality: ${f.quality[0]}–${f.quality[1]}` });
  if (f.evalStatuses.length) chips.push({ id: "evalStatuses", label: "Evaluation: " + f.evalStatuses.map((o) => EVAL_LABEL[o]).join(", ") });
  if (f.reviewStatuses.length) chips.push({ id: "reviewStatuses", label: "Review: " + f.reviewStatuses.map((o) => REVIEW_LABEL[o]).join(", ") });
  if (f.languages.length) chips.push({ id: "languages", label: "Language: " + f.languages.map((o) => LANGUAGE_LABEL[o]).join(", ") });
  if (f.duration !== "any") chips.push({ id: "duration", label: "Duration: " + DURATION_BUCKETS.find((d) => d.id === f.duration)!.label });
  if (!isFull(f.objection)) chips.push({ id: "objection", label: `Objection handling: ${f.objection[0]}–${f.objection[1]}` });
  if (!isFull(f.discovery)) chips.push({ id: "discovery", label: `Discovery: ${f.discovery[0]}–${f.discovery[1]}` });
  return chips;
}

/** Reset a single filter by chip id. */
export function clearFilter(f: CallFilters, id: string): CallFilters {
  const d = defaultFilters();
  return { ...f, [id]: (d as unknown as Record<string, unknown>)[id] } as CallFilters;
}

/** Parse initial filters from URL search params (deep links from other pages). */
export function filtersFromParams(p: URLSearchParams): CallFilters {
  const f = defaultFilters();
  const list = (k: string) => (p.get(k) ?? "").split(",").filter(Boolean);
  f.q = p.get("q") ?? "";
  f.salespersonIds = list("salesperson");
  f.outcomes = list("outcome") as Outcome[];
  f.evalStatuses = list("evaluation") as EvaluationStatus[];
  f.reviewStatuses = list("review") as ReviewStatus[];
  f.languages = list("language") as Language[];
  const preset = p.get("date");
  if (preset) f.date = resolvePreset(preset as DateRangeValue["preset"]);
  return f;
}
