import { CATEGORIES } from "@/config/rubric";
import { EVAL_LABEL, LANGUAGE_LABEL, OUTCOME_BY_ID, REVIEW_LABEL } from "@/config/ui";
import type { CallRow } from "@/types";
import { formatDateTime } from "./dates";

const esc = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formula injection as well as quoting.
  const safe = /^[=+\-@]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function callRowsToCsv(rows: CallRow[]): string {
  const headers = ["Call ID", "Callyzer call ID", "Prospect", "Phone", "Salesperson", "Call date", "Duration (sec)", "Outcome", "Language",
    "Overall quality score", "Discovery score", "Objection-handling score", "Closing score", "Evaluation status", "Review status",
    ...CATEGORIES.map((c) => `${c.label} score`), "Note"];
  const body = rows.map((r) => [
    r.call.id, r.call.callyzerCallId, r.call.prospectName, r.call.phoneNumber, r.salesperson.name, formatDateTime(r.call.callDate),
    r.call.durationSeconds, OUTCOME_BY_ID[r.call.outcome].label, LANGUAGE_LABEL[r.call.language],
    r.overall, r.discovery === null ? null : Math.round(r.discovery), r.objection, r.closing,
    EVAL_LABEL[r.call.evaluationStatus], REVIEW_LABEL[r.call.reviewStatus],
    ...CATEGORIES.map((c) => r.evaluation?.categoryScores[c.id].score ?? null),
    "Illustrative mock data",
  ]);
  return toCsv(headers, body);
}

export const stamp = () => new Date().toISOString().slice(0, 10);
