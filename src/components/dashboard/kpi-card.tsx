import type { ReactNode } from "react";
import Link from "next/link";
import { DeltaPill, type DeltaOptions } from "@/components/dashboard/delta";
import { InfoPopover } from "@/components/dashboard/info-popover";
import {
  METRICS,
  toneFor,
  type MetricId,
  type MetricTone,
} from "@/components/dashboard/metric-catalog";
import { cn } from "@/lib/utils";

export const TONE_DOT: Record<MetricTone, string> = {
  success: "bg-success",
  warning: "bg-streak-orange",
  danger: "bg-danger",
  neutral: "bg-text-muted",
};

export const TONE_VALUE: Record<MetricTone, string> = {
  success: "text-success-dark",
  warning: "text-shop-amber-dark",
  danger: "text-danger",
  neutral: "",
};

/** The health tone of a value against its catalog threshold (neutral without one). */
export function metricTone(metric: MetricId, value: number | null | undefined): MetricTone {
  const def = METRICS[metric] as { threshold?: Parameters<typeof toneFor>[1] };
  return toneFor(value, def.threshold);
}

export type KpiDelta = DeltaOptions & { current: number; previous: number | null | undefined };

/**
 * A north-star KPI card: label + info, big value, a period-over-period delta pill and a hint (no
 * sparkline: the time series live in the charts below). Every KPI has the same anatomy so a row
 * reads at a glance. `onOpen` adds a "Ver las compras" action that opens the list behind the number. When `toneValue` is given,
 * the value and a status dot are coloured by the metric's catalog threshold (health metrics only;
 * plain magnitudes like income stay neutral). The explanation comes from the metric catalog.
 */
export function KpiCard({
  metric,
  label,
  value,
  toneValue,
  delta,
  hint,
  href,
  onOpen,
  openLabel = "Ver las compras",
  className,
}: {
  metric: MetricId;
  /** Overrides the catalog label (the card's short name). */
  label?: string;
  value: ReactNode;
  /** Numeric value used to colour the card by the metric's threshold. */
  toneValue?: number | null;
  delta?: KpiDelta;
  hint?: ReactNode;
  href?: string;
  /** Opens the detail behind the number (e.g. the purchases a money counter adds up). */
  onOpen?: () => void;
  openLabel?: string;
  className?: string;
}) {
  const def = METRICS[metric];
  const tone = toneValue === undefined ? "neutral" : metricTone(metric, toneValue);
  const name = label ?? def.label;
  return (
    <div
      className={cn(
        "border-border bg-surface dash-card-enter flex min-w-0 flex-col rounded-2xl border p-[18px]",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {tone !== "neutral" ? (
          <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[tone])} aria-hidden />
        ) : null}
        <p className="text-text-muted truncate text-[13px] font-bold" title={name}>
          {name}
        </p>
        <InfoPopover metric={metric} className="ml-auto shrink-0" />
      </div>
      <p
        className={cn(
          "font-display dash-stat-pop mt-1.5 text-[32px] leading-[38px] font-extrabold tracking-tight whitespace-nowrap",
          TONE_VALUE[tone],
        )}
      >
        {value}
      </p>
      {delta ? (
        <div className="mt-1.5 min-h-[22px]">
          <DeltaPill {...delta} />
        </div>
      ) : null}
      {hint ? <p className="text-text-muted mt-1.5 text-[13px] text-pretty">{hint}</p> : null}
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${openLabel}: ${name}`}
          className="text-primary hover:text-primary-dark mt-auto cursor-pointer self-start pt-2.5 text-[13px] font-extrabold"
        >
          {openLabel} →
        </button>
      ) : null}
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

/** The KPI row: five (or four) equal cards that wrap on narrow screens. */
export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3">
      {children}
    </div>
  );
}
