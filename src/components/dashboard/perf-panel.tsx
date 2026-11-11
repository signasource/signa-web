"use client";

import { GoldenTile } from "@/components/dashboard/golden-row";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { PerfChart, type RangeSelect, type ValueFormat } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
import { usePerfWidget } from "@/components/dashboard/usage-queries";
import type { PerfMetrics } from "@/lib/api/metrics";

export { REFRESH_MS } from "@/components/dashboard/usage-queries";

export type PerfProps = { range: { from: string; to: string }; step: number; live: boolean };

/** Query for a single performance widget; rolling refetch while "live". */
export function usePerfQuery(widget: string, { range, step, live }: PerfProps) {
  return usePerfWidget(widget, range, step, live);
}

/** A line-chart panel backed by a performance widget (Prometheus via the backend). */
export function PerfPanel({
  widget,
  title,
  subtitle,
  metric,
  format,
  onSelectRange,
  ...perf
}: PerfProps & {
  widget: string;
  title: string;
  subtitle?: string;
  metric?: MetricId;
  format: ValueFormat;
  onSelectRange?: RangeSelect;
}) {
  const q = usePerfQuery(widget, perf);
  return (
    <PerfChart
      title={title}
      subtitle={subtitle}
      metric={metric}
      data={q.data}
      isPending={q.isPending}
      isError={q.isError}
      isFetching={q.isFetching}
      format={format}
      onSelectRange={onSelectRange}
    />
  );
}

/** The last non-null point of the first series (the "current" value for a tile). */
export function latestValue(data: PerfMetrics | undefined): number | null {
  const points = data?.series[0]?.points;
  if (!points) return null;
  for (let i = points.length - 1; i >= 0; i -= 1) {
    if (points[i]!.v != null) return points[i]!.v;
  }
  return null;
}

/**
 * A golden tile backed by a performance widget: shows the latest value, coloured by the metric's
 * catalog threshold (or an "up/down" status for `kind="up"`). Degrades to "sin acceso a Grafana".
 */
export function PerfGoldenTile({
  widget,
  metric,
  kind,
  format,
  ...perf
}: PerfProps & {
  widget: string;
  metric: MetricId;
  kind?: "up";
  format?: ValueFormat;
}) {
  const q = usePerfQuery(widget, perf);
  const v = latestValue(q.data);

  if (q.data && !q.data.available) {
    return <GoldenTile metric={metric} value="—" tone="neutral" hint="Sin acceso a Grafana" />;
  }
  if (kind === "up") {
    const up = v != null && v >= 1;
    return (
      <GoldenTile
        metric={metric}
        value={v == null ? "—" : up ? "Operativo" : "Caído"}
        tone={v == null ? "neutral" : up ? "success" : "danger"}
      />
    );
  }
  return (
    <GoldenTile metric={metric} value={v == null ? "—" : (format ?? fmtCount)(v)} rawValue={v} />
  );
}
