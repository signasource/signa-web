"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { metricsApi, type PerfMetrics } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";

/** How often every widget refreshes while the dashboard is "en vivo". */
export const REFRESH_MS = 30_000;

/**
 * Shared TanStack queries for the usage dashboard. Every hook takes a range or `null` (disabled), so
 * the same hook serves the selected window and the previous equal-length window used for the
 * "vs. período anterior" deltas and dashed chart lines. Keys are
 * `["admin","metrics",<kind>,…,from,to]`, so tabs reading the same endpoint share one cache entry.
 */
function options(range: DateTimeRange | null, live: boolean) {
  return {
    enabled: Boolean(range?.from && range?.to),
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : (false as const),
  };
}

export function useGrowthQuery(range: DateTimeRange | null, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "growth", range?.from, range?.to],
    queryFn: () => metricsApi.growth({ from: range!.from, to: range!.to }),
    ...options(range, live),
  });
}

export function useBusinessQuery(range: DateTimeRange | null, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "business", range?.from, range?.to],
    queryFn: () => metricsApi.business({ from: range!.from, to: range!.to }),
    ...options(range, live),
  });
}

export function useLearningQuery(
  range: DateTimeRange | null,
  live: boolean,
  courseIds: string[] = [],
) {
  return useQuery({
    queryKey: ["admin", "metrics", "learning", range?.from, range?.to, ...courseIds],
    queryFn: () =>
      metricsApi.learning({
        from: range!.from,
        to: range!.to,
        courseIds: courseIds.length > 0 ? courseIds : undefined,
      }),
    ...options(range, live),
  });
}

export function useGamificationQuery(range: DateTimeRange | null, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "gamification", range?.from, range?.to],
    queryFn: () => metricsApi.gamification({ from: range!.from, to: range!.to }),
    ...options(range, live),
  });
}

export function usePerfWidget(
  widget: string,
  range: DateTimeRange | null,
  step: number,
  live: boolean,
) {
  return useQuery<PerfMetrics>({
    queryKey: ["admin", "metrics", "perf", widget, range?.from, range?.to, step],
    queryFn: () => metricsApi.perf(widget, { from: range!.from, to: range!.to, step }),
    ...options(range, live),
  });
}
