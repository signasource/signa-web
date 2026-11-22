"use client";

import { useState, type ReactNode } from "react";
import type { DeltaOptions } from "@/components/dashboard/delta";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { KpiCard, KpiRow } from "@/components/dashboard/kpi-card";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { PerfChart, type RangeSelect, type ValueFormat } from "@/components/dashboard/perf-chart";
import {
  fmtBytes,
  fmtCores,
  fmtLatency,
  fmtPercent,
  fmtPercentRatio,
  fmtRate1,
  fmtReqsShort,
} from "@/components/dashboard/perf-format";
import { PerfPanel, type PerfProps } from "@/components/dashboard/perf-panel";
import { Card, CardTitle, LoadingState } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import {
  pct1,
  perfAverage,
  perfPeak,
  rateOrNull,
  seriesValues,
} from "@/components/dashboard/usage-math";
import { useBusinessQuery, usePerfWidget } from "@/components/dashboard/usage-queries";
import { type BusinessMetrics, type PerfMetrics, type PerfSeries } from "@/lib/api/metrics";
import { previousRange, spanSeconds } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

export type InfraProps = PerfProps & { onSelectRange: RangeSelect };

const CAMERA_BLOCK_TYPES = new Set(["VISUAL_RECOGNITION", "PERFORM_SIGN", "SPELL_NAME"]);

/** Camera-exercise accuracy from the per-block-type breakdown (null without attempts). */
export function cameraAccuracy(b: BusinessMetrics | undefined): {
  evaluated: number;
  percent: number | null;
} {
  const types = (b?.accuracy.byBlockType ?? []).filter((t) => CAMERA_BLOCK_TYPES.has(t.type));
  const evaluated = types.reduce((s, t) => s + t.evaluated, 0);
  const correct = types.reduce((s, t) => s + t.correct, 0);
  return { evaluated, percent: rateOrNull(correct, evaluated) };
}

/** Infraestructura: backend metrics. */
export function InfraTab(props: InfraProps) {
  return (
    <div className="flex flex-col gap-5">
      <BackendInfra {...props} />
    </div>
  );
}

/**
 * A KPI card fed by a Prometheus widget: the window's average (with its peak in the hint), the
 * change vs. the previous window.
 */
function PerfKpi({
  widget,
  metric,
  format,
  scale = 1,
  hint,
  delta,
  toned = true,
  ...perf
}: PerfProps & {
  widget: string;
  metric: MetricId;
  format: ValueFormat;
  /** Multiplier applied before the delta (e.g. 100 to compare a ratio in pp). */
  scale?: number;
  hint?: (avg: number, peak: number | null) => ReactNode;
  delta?: DeltaOptions | false;
  toned?: boolean;
}) {
  const q = usePerfWidget(widget, perf.range, perf.step, perf.live);
  const prev = usePerfWidget(widget, previousRange(perf.range), perf.step, perf.live);
  const avg = perfAverage(q.data);
  const prevAvg = perfAverage(prev.data);
  if (q.data && !q.data.available) {
    return <KpiCard metric={metric} value="—" hint="Sin acceso a Grafana" />;
  }
  return (
    <KpiCard
      metric={metric}
      value={avg == null ? "—" : format(avg)}
      toneValue={toned ? avg : undefined}
      delta={
        avg == null || delta === false
          ? undefined
          : {
              current: avg * scale,
              previous: prevAvg == null ? null : prevAvg * scale,
              ...delta,
            }
      }
      hint={
        avg == null
          ? q.isPending
            ? "Cargando…"
            : "Sin datos en este período"
          : hint?.(avg, perfPeak(q.data))
      }
    />
  );
}

/** Two widgets drawn as named series on one chart (p95 + p99, 4xx + 5xx). */
function DualPerfChart({
  title,
  metric,
  widgets,
  names,
  colors,
  format,
  onSelectRange,
  ...perf
}: InfraProps & {
  title: string;
  metric: MetricId;
  widgets: [string, string];
  names: [string, string];
  colors: [string, string];
  format: ValueFormat;
}) {
  const a = usePerfWidget(widgets[0], perf.range, perf.step, perf.live);
  const b = usePerfWidget(widgets[1], perf.range, perf.step, perf.live);
  const data: PerfMetrics | undefined =
    a.data || b.data
      ? {
          widget: `${widgets[0]}+${widgets[1]}`,
          available: Boolean(a.data?.available || b.data?.available),
          series: [...(a.data?.series.slice(0, 1) ?? []), ...(b.data?.series.slice(0, 1) ?? [])],
        }
      : undefined;
  const bothPresent = (a.data?.series.length ?? 0) > 0 && (b.data?.series.length ?? 0) > 0;
  return (
    <PerfChart
      title={title}
      metric={metric}
      data={data}
      isPending={a.isPending && b.isPending}
      isError={a.isError && b.isError}
      isFetching={a.isFetching || b.isFetching}
      format={format}
      onSelectRange={onSelectRange}
      seriesNames={bothPresent ? names : undefined}
      colors={bothPresent ? colors : undefined}
      showKindToggle={false}
      legend
    />
  );
}

function BackendInfra({ onSelectRange, ...perf }: InfraProps) {
  const prev = previousRange(perf.range);
  const business = useBusinessQuery(perf.range, perf.live);
  const prevBusiness = useBusinessQuery(prev, perf.live);
  const throughput = usePerfWidget("throughput", perf.range, perf.step, perf.live);
  const prevThroughput = usePerfWidget("throughput", prev, perf.step, perf.live);
  const camera = cameraAccuracy(business.data);
  const prevCamera = cameraAccuracy(prevBusiness.data);

  return (
    <div className="flex flex-col gap-4">
      <KpiRow>
        <PerfKpi
          {...perf}
          widget="latency_p95"
          metric="latency_p95"
          format={fmtLatency}
          delta={{ mode: "abs", good: "down", format: fmtLatency }}
          hint={() => "objetivo < 300 ms"}
        />
        <PerfKpi
          {...perf}
          widget="error_rate"
          metric="error_rate"
          format={fmtPercentRatio}
          scale={100}
          delta={{ mode: "pp", good: "down" }}
          hint={() => "5xx sobre el total"}
        />
        <PerfKpi
          {...perf}
          widget="throughput"
          metric="throughput"
          format={fmtReqsShort}
          toned={false}
          delta={{ decimals: 0 }}
          hint={(_, peak) => (peak == null ? null : `pico ${fmtReqsShort(peak)}`)}
        />
        <PerfKpi
          {...perf}
          widget="cpu_host"
          metric="cpu_host"
          format={fmtPercent}
          delta={false}
          hint={(_, peak) => (peak == null ? null : `pico ${fmtPercent(peak)}`)}
        />
        <KpiCard
          metric="recognition_accuracy"
          value={camera.percent == null ? "—" : pct1(camera.percent)}
          toneValue={camera.percent}
          delta={
            camera.percent == null
              ? undefined
              : { current: camera.percent, previous: prevCamera.percent, mode: "pp" }
          }
          hint={`${NUMBER.format(camera.evaluated)} ejercicios con cámara`}
        />
      </KpiRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <DualPerfChart
          {...perf}
          onSelectRange={onSelectRange}
          title="Latencia HTTP"
          metric="latency_p95"
          widgets={["latency_p95", "latency_p99"]}
          names={["p95", "p99"]}
          colors={["var(--color-primary)", "var(--color-accent-teal)"]}
          format={fmtLatency}
        />
        <DualPerfChart
          {...perf}
          onSelectRange={onSelectRange}
          title="Tasa de error"
          metric="error_rate"
          widgets={["error_rate_4xx", "error_rate"]}
          names={["4xx", "5xx"]}
          colors={["var(--color-primary)", "var(--color-danger)"]}
          format={fmtPercentRatio}
        />
        <PerfChart
          title="Consultas por segundo"
          metric="throughput"
          data={throughput.data}
          isPending={throughput.isPending}
          isError={throughput.isError}
          isFetching={throughput.isFetching}
          format={(v) => Math.round(v).toLocaleString("es-AR")}
          onSelectRange={onSelectRange}
          seriesNames={["req/s"]}
          previous={prevThroughput.data}
          previousShiftSeconds={spanSeconds(perf.range)}
          showKindToggle={false}
        />
        <SlowOpsTable {...perf} />
      </div>

      <Collapsible title="Sistema y recursos" summary={<SystemSummary {...perf} />} panels={5}>
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="cpu_host"
          metric="cpu_host"
          title="CPU del servidor"
          format={fmtPercent}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="mem_host"
          metric="mem_host"
          title="Memoria del servidor"
          format={fmtPercent}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="cpu_containers"
          metric="cpu_containers"
          title="CPU por contenedor"
          format={fmtCores}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="mem_containers"
          metric="mem_containers"
          title="Memoria por contenedor"
          format={fmtBytes}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="jvm_heap"
          metric="jvm_heap"
          title="Heap de la JVM"
          format={fmtBytes}
        />
      </Collapsible>
    </div>
  );
}

/**
 * A diagnostic group collapsed to one line: its name, a one-line verdict, and a toggle that
 * reveals its panels. These are for investigating, not for daily monitoring.
 */
function Collapsible({
  title,
  summary,
  panels,
  children,
}: {
  title: string;
  summary: ReactNode;
  panels: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4">
        <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
        <span className="text-text-muted min-w-0 flex-1 text-[13px]">{summary}</span>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="text-primary hover:text-primary-dark cursor-pointer text-[13px] font-extrabold whitespace-nowrap"
        >
          {open ? "Ocultar paneles" : `Mostrar ${panels} paneles`}
        </button>
      </Card>
      {open ? <div className="grid gap-4 lg:grid-cols-2">{children}</div> : null}
    </div>
  );
}

/** "CPU, memoria, … · todo dentro de lo normal", or what needs a look. */
function SystemSummary(perf: PerfProps) {
  const cpu = usePerfWidget("cpu_host", perf.range, perf.step, perf.live);
  const mem = usePerfWidget("mem_host", perf.range, perf.step, perf.live);
  const cpuPeak = perfPeak(cpu.data);
  const memPeak = perfPeak(mem.data);
  const issues = [
    cpuPeak != null && cpuPeak >= 85 ? `CPU llegó a ${fmtPercent(cpuPeak)}` : null,
    memPeak != null && memPeak >= 90 ? `memoria llegó a ${fmtPercent(memPeak)}` : null,
  ].filter(Boolean);
  const verdict =
    cpuPeak == null && memPeak == null
      ? "sin datos"
      : issues.length
        ? `revisar: ${issues.join(" · ")}`
        : "todo dentro de lo normal";
  return (
    <>
      CPU, memoria, contenedores, JVM ·{" "}
      <span className={issues.length ? "text-danger font-bold" : undefined}>{verdict}</span>
    </>
  );
}

/** "POST /lessons/{id}/attempts" from a series' method/uri labels. */
export function endpointLabel(labels: Record<string, string>): string {
  const path = labels.uri ?? labels.name ?? Object.values(labels).find((v) => v) ?? "—";
  return labels.method ? `${labels.method} ${path}` : path;
}

function mean(s: PerfSeries): number | null {
  const values = seriesValues(s);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/**
 * "Operaciones más lentas": p95 per endpoint over the window (slowest first) with each endpoint's
 * traffic, as a ranking table instead of ten overlaid lines.
 */
function SlowOpsTable(perf: PerfProps) {
  const slow = usePerfWidget("slowest_ops", perf.range, perf.step, perf.live);
  const rates = usePerfWidget("endpoint_rate", perf.range, perf.step, perf.live);

  const rateByEndpoint = new Map(
    (rates.data?.series ?? []).map((s) => [endpointLabel(s.labels), mean(s)]),
  );
  const rows = (slow.data?.series ?? [])
    .map((s) => ({ label: endpointLabel(s.labels), p95: mean(s) }))
    .filter((r): r is { label: string; p95: number } => r.p95 != null)
    .sort((a, b) => b.p95 - a.p95)
    .slice(0, 5);

  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-start gap-1.5">
        <div className="min-w-0">
          <CardTitle>Operaciones más lentas</CardTitle>
          <p className="text-text-muted mt-0.5 text-[13px]">p95 por endpoint en el período</p>
        </div>
        <InfoPopover metric="slowest_ops" className="ml-auto" />
      </div>
      {slow.isPending ? (
        <LoadingState>Cargando operaciones…</LoadingState>
      ) : slow.data && !slow.data.available ? (
        <p className="text-text-muted text-sm">Sin acceso a Grafana.</p>
      ) : rows.length === 0 ? (
        <p className="text-text-muted text-sm">Sin datos en este período.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead className="sr-only">
            <tr>
              <th>Operación</th>
              <th>Consultas por segundo</th>
              <th>p95</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rate = rateByEndpoint.get(r.label);
              return (
                <tr key={r.label} className="border-fill border-t">
                  <td
                    className="max-w-0 truncate py-2.5 pr-3 font-mono text-[13px]"
                    title={r.label}
                  >
                    {r.label}
                  </td>
                  <td className="text-text-muted py-2.5 pl-3 text-right whitespace-nowrap">
                    {rate == null ? "—" : fmtRate1(rate)}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 pl-3 text-right font-extrabold whitespace-nowrap",
                      r.p95 >= 0.5 ? "text-shop-amber-dark" : "",
                    )}
                  >
                    {fmtLatency(r.p95)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}
