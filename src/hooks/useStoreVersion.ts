"use client";
import { useSyncExternalStore } from "react";
import { getStoreVersion, subscribeStore } from "@/services";

/** Re-render when mock store (reviews / prototype toggles) changes. */
export function useStoreVersion() {
  return useSyncExternalStore(subscribeStore, getStoreVersion, () => 0);
}
