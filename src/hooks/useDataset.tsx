"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getDataset } from "@/services";
import { buildRows } from "@/lib/rows";
import type { Dataset, Row, Salesperson } from "@/types";
import { useAsync, type AsyncState } from "./useAsync";

interface Ctx extends AsyncState<Dataset> { rows: Row[]; salespeople: Salesperson[] }
const C = createContext<Ctx | null>(null);

/** One fetch of the centralized mock dataset shared by every page. */
export function DatasetProvider({ children }: { children: ReactNode }) {
  const state = useAsync(getDataset, []);
  const rows = useMemo(() => (state.data ? buildRows(state.data) : []), [state.data]);
  const value = useMemo<Ctx>(() => ({ ...state, rows, salespeople: state.data?.salespeople ?? [] }), [state, rows]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useDataset() {
  const v = useContext(C);
  if (!v) throw new Error("useDataset must be used inside DatasetProvider");
  return v;
}
