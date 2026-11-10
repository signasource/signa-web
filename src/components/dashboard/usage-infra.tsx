"use client";

import { useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { MetricsTabs, type TabItem } from "@/components/dashboard/metrics-tabs";
import { MetricStat } from "@/components/dashboard/metric-stat";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import {
  fmtBytes,
  fmtCores,
  fmtLatency,
  fmtPercent,
  fmtPercentRatio,
  fmtReqs,
} from "@/components/dashboard/perf-format";
import {
  PerfGoldenTile,
  PerfPanel,
  REFRESH_MS,
  usePerfQuery,
  type PerfProps,
} from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ErrorState, LoadingState } from "@/components/dashboard/ui";
import { NUMBER, useBusinessMetrics } from "@/components/dashboard/usage-business";
import { metricsApi } from "@/lib/api/metrics";
import { PerfChart } from "@/components/dashboard/perf-chart";

type InfraKey = "backend" | "web" | "ml";

const SUB_TABS: TabItem<InfraKey>[] = [
  { key: "backend", label: "Backend (signa-api)" },
  { key: "web", label: "Web / Landing" },
  { key: "ml", label: "ML (reconocimiento)" },
];

export type InfraProps = PerfProps & { onSelectRange: RangeSelect };

/** Infraestructura, sub-dividida por superficie (backend, web, ML) para distintas personas de admin. */
export function InfraTab(props: InfraProps) {
  const [sub, setSub] = useState<InfraKey>("backend");
  return (
    <div className="flex flex-col gap-5">
      <MetricsTabs tabs={SUB_TABS} active={sub} onChange={setSub} idBase="infra" />
      <p className="text-text-muted text-[13px]">
        Las métricas de performance vienen de Prometheus vía Grafana Cloud: en producción se poblan
        solas; en local (o sin token de lectura de Grafana) los paneles muestran «sin datos».
      </p>
      {sub === "backend" ? <BackendInfra {...props} /> : null}
      {sub === "web" ? <WebInfra {...props} /> : null}
      {sub === "ml" ? <MlInfra {...props} /> : null}
    </div>
  );
}

/** A labelled group of panels within a sub-tab. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-text-muted text-sm font-extrabold tracking-wider uppercase">{title}</h3>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </div>
  );
}

/**
 * Combined p95 + p99 latency panel: queries both widgets and renders them as two overlaid series
 * with different colors on a single chart.
 */
function DualLatencyPanel({ onSelectRange, ...perf }: InfraProps) {
  const p95 = usePerfQuery("latency_p95", perf);
  const p99 = usePerfQuery("latency_p99", perf);

  const p95Series = (p95.data?.series ?? []).map((s) => ({
    ...s,
    labels: { ...s.labels, name: "p95" },
  }));
  const p99Series = (p99.data?.series ?? []).map((s) => ({
    ...s,
    labels: { ...s.labels, name: "p99" },
  }));

  const combined =
    p95.data || p99.data
      ? {
          widget: "latency_combined",
          available: (p95.data?.available ?? false) || (p99.data?.available ?? false),
          series: [...p95Series, ...p99Series],
        }
      : undefined;

  return (
    <PerfChart
      title="Latencia HTTP (p95 / p99)"
      metric="latency_p95"
      data={combined}
      isPending={p95.isPending && p99.isPending}
      isError={p95.isError && p99.isError}
      isFetching={p95.isFetching || p99.isFetching}
      format={fmtLatency}
      onSelectRange={onSelectRange}
    />
  );
}

function BackendInfra({ onSelectRange, ...perf }: InfraProps) {
  return (
    <div className="flex flex-col gap-6">
      <GoldenRow>
        <PerfGoldenTile {...perf} widget="backend_up" metric="backend_up" kind="up" />
        <PerfGoldenTile {...perf} widget="r2_up" metric="r2_up" kind="up" />
        <PerfGoldenTile {...perf} widget="latency_p95" metric="latency_p95" format={fmtLatency} />
        <PerfGoldenTile
          {...perf}
          widget="error_rate"
          metric="error_rate"
          format={fmtPercentRatio}
        />
        <PerfGoldenTile {...perf} widget="cpu_host" metric="cpu_host" format={fmtPercent} />
      </GoldenRow>

      <Section title="API · HTTP">
        <DualLatencyPanel {...perf} onSelectRange={onSelectRange} />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="throughput"
          metric="throughput"
          title="Throughput (req/s)"
          format={fmtReqs}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="error_rate"
          metric="error_rate"
          title="Tasa de error (5xx)"
          format={fmtPercentRatio}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="error_rate_4xx"
          metric="error_rate_4xx"
          title="Tasa de error (4xx)"
          format={fmtPercentRatio}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="slowest_ops"
          metric="slowest_ops"
          title="Operaciones más lentas (p95)"
          subtitle="Top 10 por endpoint"
          format={fmtLatency}
        />
      </Section>

      <Section title="Sistema y recursos">
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="cpu_host"
          metric="cpu_host"
          title="CPU del host"
          format={fmtPercent}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="mem_host"
          metric="mem_host"
          title="Memoria del host"
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
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="jvm_gc_pause"
          metric="jvm_gc_pause"
          title="Pausas de GC"
          format={fmtLatency}
        />
      </Section>
    </div>
  );
}

function WebInfra({ onSelectRange, ...perf }: InfraProps) {
  return (
    <div className="flex flex-col gap-6">
      <GoldenRow>
        <PerfGoldenTile
          {...perf}
          widget="animation_latency"
          metric="animation_latency"
          format={fmtLatency}
        />
      </GoldenRow>
      <div className="grid gap-4 lg:grid-cols-2">
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="web_vitals"
          metric="web_vitals"
          title="Web Vitals (p75)"
          subtitle="LCP · INP · CLS reportados por los clientes"
          format={fmtLatency}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="animation_latency"
          metric="animation_latency"
          title="Latencia de animaciones (p95)"
          subtitle="Reportada por los clientes"
          format={fmtLatency}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="screen_load"
          metric="screen_load"
          title="Carga de pantallas (p75)"
          subtitle="Reportada por la app móvil"
          format={fmtLatency}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="client_errors"
          metric="client_errors"
          title="Errores de cliente"
          subtitle="Por tipo (red, render, HTTP)"
          format={fmtReqs}
        />
      </div>
    </div>
  );
}

const CAMERA_BLOCK_TYPES = new Set(["VISUAL_RECOGNITION", "PERFORM_SIGN", "SPELL_NAME"]);

function useMlMetrics(range: { from: string; to: string }, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "ml", range.from, range.to],
    queryFn: () => metricsApi.ml({ from: range.from, to: range.to }),
    enabled: Boolean(range.from && range.to),
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : false,
  });
}

function MlInfra({ onSelectRange, ...perf }: InfraProps) {
  const business = useBusinessMetrics(perf.range, perf.live);
  const ml = useMlMetrics(perf.range, perf.live);

  const cameraTypes = (business.data?.accuracy.byBlockType ?? []).filter((b) =>
    CAMERA_BLOCK_TYPES.has(b.type),
  );
  const evaluated = cameraTypes.reduce((s, b) => s + b.evaluated, 0);
  const correct = cameraTypes.reduce((s, b) => s + b.correct, 0);
  const accuracy = evaluated ? Math.round((correct / evaluated) * 1000) / 10 : null;

  return (
    <div className="flex flex-col gap-6">
      <GoldenRow>
        <GoldenTile metric="recognition_attempts" value={NUMBER.format(evaluated)} tone="neutral" />
        <PerfGoldenTile
          {...perf}
          widget="ml_inference_latency"
          metric="ml_inference_latency"
          format={fmtLatency}
        />
      </GoldenRow>

      <p className="text-text-muted text-[13px]">
        El reconocimiento corre <strong>en el dispositivo</strong>: su salud es independiente del
        backend. La latencia de inferencia la reporta la app vía telemetría.
      </p>

      <PerfPanel
        {...perf}
        onSelectRange={onSelectRange}
        widget="ml_inference_latency"
        metric="ml_inference_latency"
        title="Latencia de inferencia (p95)"
        subtitle="Tiempo promedio del modelo en reconocer — reportado por la app"
        format={fmtLatency}
      />

      {/* Señas reconocidas */}
      <div className="border-border flex items-center gap-3 border-t pt-5">
        <h3 className="font-display text-lg font-bold tracking-tight">Señas reconocidas</h3>
      </div>

      {ml.isPending ? (
        <LoadingState>Cargando señas reconocidas…</LoadingState>
      ) : ml.isError && !ml.data ? (
        <ErrorState>No pudimos cargar las señas reconocidas.</ErrorState>
      ) : (
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Señas reconocidas por la cámara</CardTitle>
            <InfoPopover metric="recognition_accuracy" className="ml-auto" />
          </div>
          <p className="text-text-muted -mt-1.5 text-[13px]">
            PERFORM_SIGN · SPELL_NAME en el período
          </p>
          {(ml.data?.recognizedSigns ?? []).length === 0 ? (
            <p className="text-text-muted text-sm">Sin reconocimientos en este período.</p>
          ) : (
            <dl className="flex flex-col">
              {ml.data!.recognizedSigns.map((s) => (
                <div
                  key={s.sign}
                  className="border-fill flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0"
                >
                  <dt className="font-bold">{s.sign}</dt>
                  <dd className="text-text-muted shrink-0 text-right">
                    <span className="text-foreground font-extrabold">{s.accuracyPercent}%</span>
                    {" · "}
                    {NUMBER.format(s.attempts)} intentos
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      )}

      {/* Señas salteadas */}
      <div className="border-border flex items-center gap-3 border-t pt-5">
        <h3 className="font-display text-lg font-bold tracking-tight">Señas salteadas</h3>
      </div>

      <Card className="flex min-w-0 flex-col gap-3">
        <CardTitle>Señas con skip de cámara</CardTitle>
        <p className="text-text-muted text-sm">
          Próximamente — requiere que la app reporte el evento de skip al backend.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricStat
          metric="recognition_accuracy"
          value={accuracy == null ? "—" : `${accuracy}%`}
          hint={`${NUMBER.format(evaluated)} ejercicios`}
        />
      </div>
    </div>
  );
}
