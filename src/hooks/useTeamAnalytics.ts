"use client";
import { getTeamAnalytics } from "@/services";
import { useAsync } from "./useAsync";
import { useDateRange } from "./useDateRange";

export function useTeamAnalytics() {
  const { range } = useDateRange();
  return { range, ...useAsync(() => getTeamAnalytics(range), [range.preset, range.from, range.to]) };
}
