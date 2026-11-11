import type { ReactNode } from "react";
import Link from "next/link";
import { DeltaPill, type DeltaMode } from "@/components/dashboard/delta";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { METRICS, type MetricId } from "@/components/dashboard/metric-catalog";
import { cn } from "@/lib/utils";

/** A minimal sparkline: normalises the values into the 0–24 viewBox and draws a single path. */
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = 100 / (values.length - 1);
  const d = values
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)} ${(24 - ((v - min) / span) * 24).toFixed(2)}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      className={cn("mt-2.5 h-7 w-full overflow-visible", className)}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        className="stroke-primary"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A north-star KPI card for the dashboard's v2 layout: label + info, big value, an optional
 * period-over-period delta pill, a hint, an optional sparkline and a "Ver detalles" link. The label
 * and explanation come from the metric catalog so a card and its popover never drift.
 */
export function KpiCard({
  metric,
  value,
  current,
  previous,
  mode,
  hint,
  spark,
  href,
  dotClassName,
}: {
  metric: MetricId;
  value: ReactNode;
  current?: number;
  previous?: number | null;
  mode?: DeltaMode;
  hint?: ReactNode;
  spark?: number[];
  href?: string;
  dotClassName?: string;
}) {
  const def = METRICS[metric];
  return (
    <div className="border-border bg-surface dash-card-enter flex min-w-0 flex-col rounded-2xl border p-[18px]">
      <div className="flex items-center gap-1.5">
        {dotClassName ? (
          <span className={cn("size-2 shrink-0 rounded-full", dotClassName)} />
        ) : null}
        <p className="text-text-muted truncate text-[13px] font-bold">{def.label}</p>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
      <p className="font-display dash-stat-pop mt-1.5 text-[32px] leading-[38px] font-extrabold tracking-tight">
        {value}
      </p>
      {current !== undefined ? (
        <div className="mt-1.5">
          <DeltaPill current={current} previous={previous ?? null} mode={mode} />
        </div>
      ) : null}
      {hint ? <p className="text-text-muted mt-1.5 text-[13px] text-pretty">{hint}</p> : null}
      {spark && spark.length > 1 ? <Sparkline values={spark} /> : null}
      {href ? (
        <Link
          href={href}
          className="text-primary hover:text-primary-dark mt-2.5 text-[13px] font-extrabold"
        >
          Ver detalles →
        </Link>
      ) : null}
    </div>
  );
}
