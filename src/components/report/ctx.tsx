"use client";
import { createContext, useContext } from "react";
import type { CallRecord, ReviewAction, Salesperson } from "@/types";

export interface ReportCtx {
  record: CallRecord;
  salesperson: Salesperson;
  actions: ReviewAction[];
  /** Highlight transcript segments and reveal the transcript panel. */
  jump: (segments: number[]) => void;
}
export const ReportContext = createContext<ReportCtx | null>(null);
export function useReport() {
  const c = useContext(ReportContext);
  if (!c) throw new Error("useReport must be used inside ReportContext");
  return c;
}
