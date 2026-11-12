"use client";
import { getTeamAnalytics } from "@/services";
import { useDateRange } from "./useDateRange";
import { useAsync } from "./useAsync";

/** Team analytics for the globally selected date range. Used by Overview and Team Analytics. */
export function useTeamAnalytics() {
  const { range } = useDateRange();
  return { range, ...useAsync(() => getTeamAnalytics(range), [range.preset, range.from, range.to]) };
}
