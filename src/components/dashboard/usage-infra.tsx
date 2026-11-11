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
  latestValue,
  PerfGoldenTile,
  PerfPanel,
  REFRESH_MS,
  usePerfQuery,
  type PerfProps,
} from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ErrorState, LoadingState } from "@/components/dashboard/ui";
import { NUMBER, useBusinessMetrics } from "@/components/dashboard/usage-business";
import { metricsApi, type PerfSeries } from "@/lib/api/metrics";
import { PerfChart } from "@/components/dashboard/perf-chart";
import { cn } from "@/lib/utils";

type InfraKey = "backend" | "web" | "ml";

const SUB_TABS: TabItem<InfraKey>[] = [
  { key: "backend", label: "Backend (signa-api)" },
  { key: "web", label: "Web / Landing" },
  { key: "ml", label: "ML (reconocimiento)" },
];

export type InfraProps = PerfProps & { onSelectRange: RangeSelect };

/** Latest value of a 1/0 "up" widget → status; null while unavailable. */
function upOf(q: ReturnType<typeof usePerfQuery>): boolean | null {
  if (!q.data?.available) return null;
  const v = latestValue(q.data);
  return v == null ? null : v >= 1;
}

/** A failures-rate widget → healthy when there are effectively no recent failures. */
function healthyOf(q: ReturnType<typeof usePerfQuery>): boolean | null {
  if (!q.data?.available) return null;
  const v = latestValue(q.data);
  return v == null ? null : v < 0.01;
}

function ServiceDot({ label, up }: { label: string; up: boolean | null }) {
  const tone = up == null ? "bg-text-muted" : up ? "bg-success" : "bg-danger";
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <span className={cn("size-2 rounded-full", tone)} />
      <span className="font-bold">{label}</span>
      <span className="text-text-muted">
        {up == null ? "sin datos" : up ? "operativo" : "con fallos"}
      </span>
    </span>
  );
}

/** Top-of-tab services strip: the health of the backend, storage, email and push at a glance. */
function ServicesBar(perf: PerfProps) {
  const backendUp = usePerfQuery("backend_up", perf);
  const r2Up = usePerfQuery("r2_up", perf);
  const emailFailures = usePerfQuery("email_failures", perf);
  const pushFailures = usePerfQuery("push_failures", perf);
  return (
    <Card className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <CardTitle>Estado de servicios</CardTitle>
      <ServiceDot label="API" up={upOf(backendUp)} />
      <ServiceDot label="Almacenamiento" up={upOf(r2Up)} />
      <ServiceDot label="Emails" up={healthyOf(emailFailures)} />
      <ServiceDot label="Notificaciones" up={healthyOf(pushFailures)} />
    </Card>
  );
}

/** Infraestructura, sub-dividida por superficie (backend, web, ML) para distintas personas de admin. */
export function InfraTab(props: InfraProps) {
  const [sub, setSub] = useState<InfraKey>("backend");
  const { range, step, live } = props;
  return (
    <div className="flex flex-col gap-5">
      <ServicesBar range={range} step={step} live={live} />
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
        <PerfGoldenTile {...perf} widget="latency_p95" metric="latency_p95" format={fmtLatency} />
        <PerfGoldenTile
          {...perf}
          widget="error_rate"
          metric="error_rate"
          format={fmtPercentRatio}
        />
        <PerfGoldenTile {...perf} widget="throughput" metric="throughput" format={fmtReqs} />
        <PerfGoldenTile {...perf} widget="cpu_host" metric="cpu_host" format={fmtPercent} />
        <PerfGoldenTile {...perf} widget="mem_host" metric="mem_host" format={fmtPercent} />
      </GoldenRow>

      <Section title="API · HTTP">
        <DualLatencyPanel {...perf} onSelectRange={onSelectRange} />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="throughput"
          metric="throughput"
          title="Consultas por segundo"
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
      </Section>

      <SlowOpsTable {...perf} />

      <Section title="Email y notificaciones">
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="email_sent"
          metric="email_sent"
          title="Emails enviados"
          subtitle="Verificación, reset de contraseña, invitaciones"
          format={fmtReqs}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="email_failures"
          metric="email_failures"
          title="Fallos de email"
          subtitle="Un fallo impide verificar cuentas o recuperar contraseñas"
          format={fmtReqs}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="push_sent"
          metric="push_sent"
          title="Notificaciones enviadas"
          subtitle="Push aceptadas por FCM (por token)"
          format={fmtReqs}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="push_failures"
          metric="push_failures"
          title="Fallos de notificaciones"
          subtitle="Push rechazadas o que no se pudieron enviar"
          format={fmtReqs}
        />
      </Section>

      <details className="group flex flex-col gap-3">
        <summary className="text-text-muted hover:text-text flex cursor-pointer items-center gap-2 text-sm font-extrabold tracking-wider uppercase">
          <span className="transition-transform group-open:rotate-90">▸</span>
          Sistema y recursos
        </summary>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
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
        </div>
      </details>
    </div>
  );
}

/**
 * "Operaciones más lentas" as a ranking table: the latest p95 per endpoint, slowest first. Reads
 * the slowest_ops widget's per-series latest value instead of overlaying ten lines on a chart.
 */
function SlowOpsTable(perf: PerfProps) {
  const q = usePerfQuery("slowest_ops", perf);

  const seriesLabel = (s: PerfSeries): string => {
    const { uri, name, method } = s.labels;
    const path = uri ?? name ?? Object.values(s.labels).find((v) => v) ?? "—";
    return method ? `${method} ${path}` : path;
  };
  const seriesLatest = (s: PerfSeries): number | null => {
    for (let i = s.points.length - 1; i >= 0; i -= 1) {
      const v = s.points[i]!.v;
      if (v != null) return v;
    }
    return null;
  };

  const rows = (q.data?.series ?? [])
    .map((s) => ({ label: seriesLabel(s), value: seriesLatest(s) }))
    .filter((r): r is { label: string; value: number } => r.value != null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <CardTitle>Operaciones más lentas</CardTitle>
        <span className="text-text-muted ml-auto text-[13px]">Top 10 por endpoint (p95)</span>
      </div>
      {q.isPending ? (
        <LoadingState>Cargando operaciones…</LoadingState>
      ) : q.data && !q.data.available ? (
        <p className="text-text-muted text-sm">Sin acceso a Grafana.</p>
      ) : rows.length === 0 ? (
        <p className="text-text-muted text-sm">Sin datos en este período.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-left text-xs font-bold">
                <th className="pb-2 font-bold">Operación</th>
                <th className="pb-2 pl-3 text-right font-bold">p95</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-fill border-t">
                  <td className="py-2 font-mono text-[13px] font-bold">{r.label}</td>
                  <td className="py-2 pl-3 text-right font-extrabold">{fmtLatency(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
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

      <PerfPanel
        {...perf}
        onSelectRange={onSelectRange}
        widget="camera_skip"
        metric="camera_skip"
        title="Señas salteadas (skip de cámara)"
        subtitle="Veces por segundo que se saltea un ejercicio con cámara — reportado por la app"
        format={fmtReqs}
      />

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
