"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { resolvePreset } from "@/lib/dates";
import type { DateRangeValue } from "@/types";

interface Ctx { range: DateRangeValue; setRange: (r: DateRangeValue) => void }
const DateRangeContext = createContext<Ctx | null>(null);
const KEY = "ffci:date-range:v1";

/** Shared date range for Overview, Team, Analytics and Reviews. Persisted locally as a preference. */
export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRangeState] = useState<DateRangeValue>(() => resolvePreset("last_30"));
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as DateRangeValue;
      setRangeState(saved.preset === "custom" ? saved : resolvePreset(saved.preset));
    } catch { /* ignore */ }
  }, []);
  const value = useMemo<Ctx>(() => ({
    range,
    setRange: (r) => {
      setRangeState(r);
      try { window.localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* ignore */ }
    },
  }), [range]);
  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used inside DateRangeProvider");
  return ctx;
}
