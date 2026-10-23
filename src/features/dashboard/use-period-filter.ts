"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { periodFromParams, type Period } from "@/lib/date-range";

export const FROM_PARAM = "desde";
export const TO_PARAM = "hasta";

/**
 * The period every dashboard figure is measured over, kept in the URL
 * (`?desde=YYYY-MM-DD&hasta=…`) like the course filter so it survives switching sections. No (or
 * invalid) params mean the whole history, which keeps the URL clean.
 */
export function usePeriodFilter(): { period: Period; setPeriod: (period: Period) => void } {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const period = periodFromParams(params.get(FROM_PARAM), params.get(TO_PARAM));

  const setPeriod = useCallback(
    (next: Period) => {
      const query = new URLSearchParams(params.toString());
      if (next) {
        query.set(FROM_PARAM, next.from);
        query.set(TO_PARAM, next.to);
      } else {
        query.delete(FROM_PARAM);
        query.delete(TO_PARAM);
      }
      const search = query.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { period, setPeriod };
}
