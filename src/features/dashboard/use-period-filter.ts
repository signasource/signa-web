"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DEFAULT_PRESET, rangeFromParams, type DateRange } from "@/lib/date-range";

export const FROM_PARAM = "desde";
export const TO_PARAM = "hasta";

/**
 * The period the activity section shows, kept in the URL (`?desde=YYYY-MM-DD&hasta=…`) like the
 * course filter. Missing or invalid values mean the default preset, which keeps the URL clean.
 */
export function usePeriodFilter(): { range: DateRange; setRange: (range: DateRange) => void } {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const range = rangeFromParams(params.get(FROM_PARAM), params.get(TO_PARAM));

  const setRange = useCallback(
    (next: DateRange) => {
      const query = new URLSearchParams(params.toString());
      const fallback = DEFAULT_PRESET.range(new Date());
      if (next.from === fallback.from && next.to === fallback.to) {
        query.delete(FROM_PARAM);
        query.delete(TO_PARAM);
      } else {
        query.set(FROM_PARAM, next.from);
        query.set(TO_PARAM, next.to);
      }
      const search = query.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { range, setRange };
}
