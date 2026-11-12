"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getDataset } from "@/services";
import { buildRows } from "@/lib/metrics";
import type { CallRow, Dataset, Salesperson } from "@/types";
import { useAsync, type AsyncState } from "./useAsync";

interface DatasetCtx extends Omit<AsyncState<Dataset>, "data"> {
  data: Dataset | undefined;
  rows: CallRow[];
  salespeople: Salesperson[];
}
const Ctx = createContext<DatasetCtx | null>(null);

/** One fetch of the centralized mock dataset, shared by every page and the shell (search, notifications). */
export function DatasetProvider({ children }: { children: ReactNode }) {
  const state = useAsync(getDataset, []);
  const rows = useMemo(() => (state.data ? buildRows(state.data) : []), [state.data]);
  const value = useMemo<DatasetCtx>(() => ({ ...state, rows, salespeople: state.data?.salespeople ?? [] }), [state, rows]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDataset() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDataset must be used inside DatasetProvider");
  return ctx;
}
