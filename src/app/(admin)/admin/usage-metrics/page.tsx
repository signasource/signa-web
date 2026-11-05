"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DatetimeRangePicker } from "@/components/dashboard/datetime-range-picker";
import { PerfChart, type ValueFormat } from "@/components/dashboard/perf-chart";
import { BusinessSection } from "@/components/dashboard/usage-business";
import { Card, PageHeading, StatCard } from "@/components/dashboard/ui";
import { metricsApi, type PerfMetrics } from "@/lib/api/metrics";
import {
  DEFAULT_SELECTION,
  deriveStepSeconds,
  resolveRange,
  type RangeSelection,
} from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

const REFRESH_MS = 30_000;

// --- value formatters (Prometheus latency buckets are in seconds) --------------------------------
const fmtLatency: ValueFormat = (v) =>
  v >= 1 ? `${v.toFixed(2)} s` : `${Math.round(v * 1000)} ms`;
const fmtPercentRatio: ValueFormat = (v) => `${(v * 100).toFixed(1)}%`;
const fmtPercent: ValueFormat = (v) => `${v.toFixed(0)}%`;
const fmtReqs: ValueFormat = (v) => `${v.toFixed(2)}/s`;
const fmtCount: ValueFormat = (v) => v.toLocaleString("es-AR");
const fmtCores: ValueFormat = (v) => v.toFixed(2);
const fmtBytes: ValueFormat = (v) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = v;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(1)} ${units[i]}`;
};

export default function UsageMetricsPage() {
  const [selection, setSelection] = useState<RangeSelection>(DEFAULT_SELECTION);
  const [live, setLive] = useState(true);
  const [now, setNow] = useState(() => new Date());

  // Re-anchor rolling presets while "live": the window (and the query keys) move with wall-clock.
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => clearInterval(id);
  }, [live]);

  // Changing the selection re-anchors "now" here (in the handler, not an effect) so a rolling
  // preset reflects the moment it was picked.
  const changeSelection = (next: RangeSelection) => {
    setSelection(next);
    setNow(new Date());
  };

  const range = useMemo(() => resolveRange(selection, now), [selection, now]);
  const step = useMemo(() => deriveStepSeconds(range), [range]);

  const perfProps = { range, step, live };

  return (
    <section className="flex flex-col gap-6">
      <PageHeading
        title="Métricas de uso"
        subtitle="Uso general de toda la app (con y sin organización): negocio, performance e infraestructura."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            aria-pressed={live}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-extrabold transition-colors",
              live ? "bg-success-light text-success-dark" : "border-border text-text-muted border",
            )}
          >
            <span className={cn("size-2 rounded-full", live ? "bg-success" : "bg-text-muted")} />
            {live ? "En vivo" : "Pausado"}
          </button>
          <DatetimeRangePicker value={selection} onChange={changeSelection} />
        </div>
      </PageHeading>

      {/* Salud del sistema */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <HealthTile {...perfProps} widget="backend_up" label="Backend" kind="up" />
        <HealthTile {...perfProps} widget="r2_up" label="R2 animaciones" kind="up" />
        <HealthTile {...perfProps} widget="latency_p95" label="Latencia p95" kind="latency" />
        <HealthTile {...perfProps} widget="error_rate" label="Tasa de error" kind="ratio" />
        <HealthTile {...perfProps} widget="cpu_host" label="CPU host" kind="percent" />
        <HealthTile {...perfProps} widget="mem_host" label="Memoria host" kind="percent" />
      </div>

      {/* Negocio */}
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">Negocio</h2>
        <BusinessSection range={range} live={live} />
      </div>

      {/* Performance */}
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Performance e infraestructura
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <PerfPanel
            {...perfProps}
            widget="latency_p95"
            title="Latencia HTTP p95"
            format={fmtLatency}
          />
          <PerfPanel
            {...perfProps}
            widget="latency_p99"
            title="Latencia HTTP p99"
            format={fmtLatency}
          />
          <PerfPanel
            {...perfProps}
            widget="throughput"
            title="Throughput (req/s)"
            format={fmtReqs}
          />
          <PerfPanel
            {...perfProps}
            widget="error_rate"
            title="Tasa de error (5xx)"
            format={fmtPercentRatio}
          />
          <PerfPanel
            {...perfProps}
            widget="slowest_ops"
            title="Operaciones más lentas (p95)"
            subtitle="Top 10 por endpoint"
            format={fmtLatency}
          />
          <PerfPanel {...perfProps} widget="cpu_host" title="CPU del host" format={fmtPercent} />
          <PerfPanel
            {...perfProps}
            widget="mem_host"
            title="Memoria del host"
            format={fmtPercent}
          />
          <PerfPanel
            {...perfProps}
            widget="cpu_containers"
            title="CPU por contenedor"
            format={fmtCores}
          />
          <PerfPanel
            {...perfProps}
            widget="mem_containers"
            title="Memoria por contenedor"
            format={fmtBytes}
          />
          <PerfPanel
            {...perfProps}
            widget="db_connections_active"
            title="Conexiones a la base (activas)"
            format={fmtCount}
          />
          <PerfPanel
            {...perfProps}
            widget="r2_presign_latency"
            title="Latencia de firma de R2 (p95)"
            format={fmtLatency}
          />
          <PerfPanel
            {...perfProps}
            widget="animation_latency"
            title="Latencia de animaciones (p95)"
            subtitle="Reportada por los clientes"
            format={fmtLatency}
          />
        </div>
      </div>
    </section>
  );
}

type PerfProps = { range: { from: string; to: string }; step: number; live: boolean };

function usePerfQuery(widget: string, { range, step, live }: PerfProps) {
  return useQuery({
    queryKey: ["admin", "metrics", "perf", widget, range.from, range.to, step],
    queryFn: () => metricsApi.perf(widget, { from: range.from, to: range.to, step }),
    enabled: Boolean(range.from && range.to),
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : false,
  });
}

function PerfPanel({
  widget,
  title,
  subtitle,
  format,
  ...perf
}: PerfProps & { widget: string; title: string; subtitle?: string; format: ValueFormat }) {
  const q = usePerfQuery(widget, perf);
  return (
    <PerfChart
      title={title}
      subtitle={subtitle}
      data={q.data}
      isPending={q.isPending}
      isError={q.isError}
      isFetching={q.isFetching}
      format={format}
    />
  );
}

type HealthKind = "up" | "latency" | "ratio" | "percent";

function latestValue(data: PerfMetrics | undefined): number | null {
  const points = data?.series[0]?.points;
  if (!points) return null;
  for (let i = points.length - 1; i >= 0; i -= 1) {
    if (points[i]!.v != null) return points[i]!.v;
  }
  return null;
}

function HealthTile({
  widget,
  label,
  kind,
  ...perf
}: PerfProps & { widget: string; label: string; kind: HealthKind }) {
  const q = usePerfQuery(widget, perf);
  const v = latestValue(q.data);
  const unavailable = q.data && !q.data.available;

  let value = "—";
  let tone = "";
  if (v != null) {
    if (kind === "up") {
      value = v >= 1 ? "Operativo" : "Caído";
      tone = v >= 1 ? "text-success-dark" : "text-danger";
    } else if (kind === "latency") {
      value = v >= 1 ? `${v.toFixed(2)} s` : `${Math.round(v * 1000)} ms`;
    } else if (kind === "ratio") {
      value = `${(v * 100).toFixed(1)}%`;
      tone = v > 0.05 ? "text-danger" : "";
    } else {
      value = `${v.toFixed(0)}%`;
      tone = v > 85 ? "text-danger" : "";
    }
  }

  if (unavailable) {
    return (
      <Card className="flex flex-col gap-1">
        <p className="text-text-muted text-[13px] font-bold">{label}</p>
        <p className="text-text-muted text-sm">Sin acceso a Grafana</p>
      </Card>
    );
  }

  return <StatCard label={label} value={<span className={tone}>{value}</span>} />;
}
