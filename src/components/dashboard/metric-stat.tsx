"use client";

import type { CSSProperties, ReactNode } from "react";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { METRICS, type MetricId } from "@/components/dashboard/metric-catalog";

/**
 * A labelled stat card that carries its metric's InfoPopover (no status dot — that's for golden
 * tiles). The label comes from the catalog so a widget and its explanation never drift apart.
 */
export function MetricStat({
  metric,
  value,
  hint,
  delay,
}: {
  metric: MetricId;
  value: ReactNode;
  hint?: ReactNode;
  delay?: number;
}) {
  const def = METRICS[metric];
  return (
    <div
      className="border-border bg-surface dash-card-enter relative flex flex-col rounded-2xl border p-[18px]"
      style={delay !== undefined ? ({ "--delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-text-muted truncate text-[13px] font-bold">{def.label}</p>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
      <p className="font-display dash-stat-pop mt-1.5 text-4xl leading-10 font-extrabold tracking-tight">
        {value}
      </p>
      {hint ? <p className="text-text-muted mt-1.5 text-[13px]">{hint}</p> : null}
    </div>
  );
}
