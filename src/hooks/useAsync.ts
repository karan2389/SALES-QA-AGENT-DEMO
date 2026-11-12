"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeStore } from "@/services";

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Runs an async service call. Keeps previous data while refetching (no flicker) and refetches
 * whenever the mock store changes (e.g. after a review is saved).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const first = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => subscribeStore(() => setTick((t) => t + 1)), []);

  const reload = useCallback(() => { first.current = true; setTick((t) => t + 1); }, []);

  useEffect(() => {
    let cancelled = false;
    if (first.current) setLoading(true);
    fnRef.current()
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (!cancelled) { setLoading(false); first.current = false; } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, reload };
}
