import { CALL_TYPE_LABEL } from "@/config/mrv1";
import { DURATION_BUCKETS, EVAL_STATUS_LABEL, GATE_LABEL, LANGUAGE_LABEL, REVIEW_LABEL, SEVERITY_ORDER } from "@/config/ui";
import { inRange, resolvePreset } from "@/lib/dates";
import type { CallType, DateRangeValue, EvalStatus, GateStatus, HumanReviewStatus, Language, Row, Severity } from "@/types";

export type RangeTuple = [number, number];
export type DurationId = (typeof DURATION_BUCKETS)[number]["id"];
export type FlagFilter = "none" | Severity;
export type Finality = "provisional" | "final";

export interface CallFilters {
  q: string; date: DateRangeValue; salespersonIds: string[]; callTypes: CallType[]; evalStatuses: EvalStatus[]; gates: GateStatus[];
  flags: FlagFilter[]; reviews: HumanReviewStatus[]; languages: Language[]; finality: Finality[]; duration: DurationId;
}
export const defaultFilters = (): CallFilters => ({
  q: "", date: resolvePreset("all"), salespersonIds: [], callTypes: [], evalStatuses: [], gates: [], flags: [], reviews: [], languages: [], finality: [], duration: "any",
});

export function applyFilters(rows: Row[], f: CallFilters): Row[] {
  const dur = DURATION_BUCKETS.find((d) => d.id === f.duration)!;
  const needle = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (needle && ![r.call.id, r.salesperson.name, r.call.callType, CALL_TYPE_LABEL[r.call.callType], r.call.status, r.call.heldReason ?? ""].join(" | ").toLowerCase().includes(needle)) return false;
    if (!inRange(r.ts, f.date)) return false;
    if (f.salespersonIds.length && !f.salespersonIds.includes(r.salesperson.id)) return false;
    if (f.callTypes.length && !f.callTypes.includes(r.call.callType)) return false;
    if (f.evalStatuses.length && !f.evalStatuses.includes(r.call.status)) return false;
    if (f.gates.length && !f.gates.includes(r.gate)) return false;
    if (f.flags.length) {
      const hit = f.flags.some((x) => (x === "none" ? r.doc && r.flagCount === 0 : r.doc && r.doc.extras.flags.some((fl) => fl.severity === x && fl.decision !== "dismissed")));
      if (!hit) return false;
    }
    if (f.reviews.length && (!r.review || !f.reviews.includes(r.review))) return false;
    if (f.languages.length && !f.languages.includes(r.call.language)) return false;
    if (f.finality.length && (!r.doc || !f.finality.includes(r.provisional ? "provisional" : "final"))) return false;
    return r.call.durationSec >= dur.min && r.call.durationSec < dur.max;
  });
}

export type SortKey = "date" | "duration" | "stage" | "psych" | "flag" | "c18" | "id" | "salesperson";
export interface SortState { key: SortKey; dir: "asc" | "desc" }
export const SORT_PRESETS: { id: string; label: string; sort: SortState }[] = [
  { id: "newest", label: "Newest first", sort: { key: "date", dir: "desc" } },
  { id: "oldest", label: "Oldest first", sort: { key: "date", dir: "asc" } },
  { id: "stage_desc", label: "Highest sales-stage %", sort: { key: "stage", dir: "desc" } },
  { id: "stage_asc", label: "Lowest sales-stage %", sort: { key: "stage", dir: "asc" } },
  { id: "psych_desc", label: "Highest psychology %", sort: { key: "psych", dir: "desc" } },
  { id: "psych_asc", label: "Lowest psychology %", sort: { key: "psych", dir: "asc" } },
  { id: "flag_desc", label: "Highest flag severity", sort: { key: "flag", dir: "desc" } },
  { id: "c18_asc", label: "Lowest C18 Objection Handling", sort: { key: "c18", dir: "asc" } },
];
export const presetIdFor = (s: SortState) => SORT_PRESETS.find((p) => p.sort.key === s.key && p.sort.dir === s.dir)?.id ?? "custom";
export const defaultDirFor = (k: SortKey): "asc" | "desc" => (k === "id" || k === "salesperson" ? "asc" : "desc");

export function sortRows(rows: Row[], s: SortState): Row[] {
  const sign = s.dir === "asc" ? 1 : -1;
  const num = (r: Row): number | null => s.key === "date" ? r.ts : s.key === "duration" ? r.call.durationSec : s.key === "stage" ? r.stage : s.key === "psych" ? r.psych : s.key === "c18" ? r.c18 : s.key === "flag" ? (r.doc ? (r.topSeverity ? SEVERITY_ORDER[r.topSeverity] : 0) : null) : null;
  return [...rows].sort((a, b) => {
    if (s.key === "id") return sign * a.call.id.localeCompare(b.call.id);
    if (s.key === "salesperson") return sign * a.salesperson.name.localeCompare(b.salesperson.name);
    const x = num(a), y = num(b);
    if (x === null && y === null) return b.ts - a.ts;
    if (x === null) return 1; // unscored calls always last
    if (y === null) return -1;
    return sign * (x - y) || b.ts - a.ts;
  });
}

export interface FilterChip { id: string; label: string }
export function activeChips(f: CallFilters, names: Record<string, string>): FilterChip[] {
  const c: FilterChip[] = [];
  if (f.q.trim()) c.push({ id: "q", label: `Search: “${f.q.trim()}”` });
  if (f.date.preset !== "all") c.push({ id: "date", label: "Date: " + (f.date.preset === "custom" ? "Custom range" : f.date.preset.replace("_", " ")) });
  if (f.salespersonIds.length) c.push({ id: "salespersonIds", label: "Salesperson: " + f.salespersonIds.map((i) => names[i] ?? i).join(", ") });
  if (f.callTypes.length) c.push({ id: "callTypes", label: "Call type: " + f.callTypes.map((x) => CALL_TYPE_LABEL[x]).join(", ") });
  if (f.evalStatuses.length) c.push({ id: "evalStatuses", label: "Status: " + f.evalStatuses.map((x) => EVAL_STATUS_LABEL[x]).join(", ") });
  if (f.gates.length) c.push({ id: "gates", label: "Gate: " + f.gates.map((x) => GATE_LABEL[x]).join(", ") });
  if (f.flags.length) c.push({ id: "flags", label: "Flags: " + f.flags.join(", ") });
  if (f.reviews.length) c.push({ id: "reviews", label: "Review: " + f.reviews.map((x) => REVIEW_LABEL[x]).join(", ") });
  if (f.languages.length) c.push({ id: "languages", label: "Language: " + f.languages.map((x) => LANGUAGE_LABEL[x]).join(", ") });
  if (f.finality.length) c.push({ id: "finality", label: "Score: " + f.finality.join(", ") });
  if (f.duration !== "any") c.push({ id: "duration", label: "Duration: " + DURATION_BUCKETS.find((d) => d.id === f.duration)!.label });
  return c;
}
export function clearFilter(f: CallFilters, id: string): CallFilters {
  return { ...f, [id]: (defaultFilters() as unknown as Record<string, unknown>)[id] } as CallFilters;
}
export function filtersFromParams(p: URLSearchParams): CallFilters {
  const f = defaultFilters();
  const list = (k: string) => (p.get(k) ?? "").split(",").filter(Boolean);
  f.q = p.get("q") ?? "";
  f.salespersonIds = list("salesperson"); f.callTypes = list("type") as CallType[]; f.evalStatuses = list("status") as EvalStatus[];
  f.reviews = list("review") as HumanReviewStatus[]; f.gates = list("gate") as GateStatus[]; f.flags = list("flag") as FlagFilter[];
  const preset = p.get("date");
  if (preset) f.date = resolvePreset(preset as DateRangeValue["preset"]);
  return f;
}
