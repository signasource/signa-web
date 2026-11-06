"use client";

import type { CSSProperties, ReactNode } from "react";
import { InfoPopover } from "@/components/dashboard/info-popover";
import {
  METRICS,
  toneFor,
  type MetricDef,
  type MetricId,
  type MetricTone,
} from "@/components/dashboard/metric-catalog";
import { cn } from "@/lib/utils";

const TONE_DOT: Record<MetricTone, string> = {
  success: "bg-success",
  warning: "bg-streak-orange",
  danger: "bg-danger",
  neutral: "bg-text-muted",
};
const TONE_VALUE: Record<MetricTone, string> = {
  success: "text-success-dark",
  warning: "text-shop-amber-dark",
  danger: "text-danger",
  neutral: "",
};

/**
 * A "golden metric": a headline tile at the top of an apartado that tells, at a glance, whether the
 * area is healthy. Colours itself from the metric's threshold (or an explicit tone) and carries the
 * same InfoPopover as every widget, so it reads correctly with no prior context.
 */
export function GoldenTile({
  metric,
  value,
  hint,
  rawValue,
  tone: toneProp,
  delay,
}: {
  metric: MetricId;
  value: ReactNode;
  hint?: ReactNode;
  /** The numeric value used to resolve the threshold tone (omit when not applicable). */
  rawValue?: number | null;
  /** Overrides the computed tone (e.g. an "up/down" status that isn't a threshold). */
  tone?: MetricTone;
  delay?: number;
}) {
  const def: MetricDef = METRICS[metric];
  const tone = toneProp ?? toneFor(rawValue, def.threshold);
  return (
    <div
      className="border-border bg-surface dash-card-enter relative flex flex-col rounded-2xl border p-[18px]"
      style={delay !== undefined ? ({ "--delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[tone])} aria-hidden="true" />
        <p className="text-text-muted truncate text-[13px] font-bold">{def.label}</p>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
      <p
        className={cn(
          "font-display dash-stat-pop mt-1.5 text-4xl leading-10 font-extrabold tracking-tight",
          TONE_VALUE[tone],
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-text-muted mt-1.5 text-[13px]">{hint}</p> : null}
    </div>
  );
}

export function GoldenRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{children}</div>;
}
