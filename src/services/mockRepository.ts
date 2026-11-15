import { REVIEWER_NAME } from "@/config/ui";
import { BASE } from "@/data/mock/generate";
import { NOW } from "@/lib/dates";
import { applyActions } from "@/lib/effective";
import { buildRows } from "@/lib/rows";
import { overview, type Overview } from "@/lib/metrics";
import type { CallMeta, CallRecord, DateRangeValue, Dataset, Mrv1Document, ReviewAction, Salesperson } from "@/types";
import { addUserAction, getPrototypeSettings, getUserActions } from "./mockStore";

/**
 * Mock repository. Every export mirrors a future Supabase / API call; replace this module and keep the signatures.
 * All numbers shown in the product derive from this single dataset.
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function gate() {
  const { slow, error } = getPrototypeSettings();
  await wait(slow ? 1600 : 160);
  if (error) throw new Error("Simulated API error (503): the call-intelligence service did not respond.");
}
const dataset = (): Dataset => applyActions(BASE, [...BASE.actions, ...getUserActions()]);

export async function getDataset(): Promise<Dataset> { await gate(); return dataset(); }
export async function getCalls(): Promise<CallMeta[]> { await gate(); return dataset().records.map((r) => r.call); }
export async function getEvaluations(): Promise<Mrv1Document[]> { await gate(); return dataset().records.flatMap((r) => (r.doc && r.call.status === "evaluated" ? [r.doc] : [])); }
export async function getSalespeople(): Promise<Salesperson[]> { await gate(); return BASE.salespeople; }
export async function getCallById(id: string): Promise<{ record: CallRecord; salesperson: Salesperson; actions: ReviewAction[] } | null> {
  await gate();
  const ds = dataset();
  const record = ds.records.find((r) => r.call.id === id);
  if (!record) return null;
  return { record, salesperson: ds.salespeople.find((s) => s.id === record.call.salespersonId)!, actions: ds.actions.filter((a) => a.callId === id).sort((a, b) => b.at.localeCompare(a.at)) };
}
export async function getTeamAnalytics(range: DateRangeValue): Promise<Overview> {
  await gate();
  const ds = dataset();
  return overview(buildRows(ds), ds.salespeople, range);
}

export type ReviewInput = Omit<ReviewAction, "id" | "at" | "by"> & { by?: string };

/** Persists a human review action to local mock state (browser only). */
export async function updateManagerReview(input: ReviewInput): Promise<ReviewAction> {
  await gate();
  if (input.kind === "dispute" && !input.notes?.trim()) throw new Error("A note is required when disputing an evaluation.");
  if (input.kind === "correct_criterion" && !input.notes?.trim()) throw new Error("A reason is required to correct a criterion.");
  if (input.kind === "note" && !input.notes?.trim()) throw new Error("Enter a note before saving.");
  const action: ReviewAction = { ...input, id: `ACT-U${Date.now().toString().slice(-7)}`, at: new Date(Math.max(Date.now(), NOW)).toISOString(), by: input.by ?? REVIEWER_NAME };
  addUserAction(action);
  return action;
}
