"use client";

import { useState, type ReactNode } from "react";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { MetricsTabs, type TabItem } from "@/components/dashboard/metrics-tabs";
import { MetricStat } from "@/components/dashboard/metric-stat";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import {
  fmtBytes,
  fmtCores,
  fmtCount,
  fmtLatency,
  fmtPercent,
  fmtPercentRatio,
  fmtReqs,
} from "@/components/dashboard/perf-format";
import { PerfGoldenTile, PerfPanel, type PerfProps } from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ProgressBar } from "@/components/dashboard/ui";
import { NUMBER, useBusinessMetrics } from "@/components/dashboard/usage-business";

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

/** A labelled group of panels within a sub-tab (keeps the backend board from being one long wall). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-text-muted text-sm font-extrabold tracking-wider uppercase">{title}</h3>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </div>
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
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="latency_p95"
          metric="latency_p95"
          title="Latencia HTTP p95"
          format={fmtLatency}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="latency_p99"
          metric="latency_p99"
          title="Latencia HTTP p99"
          format={fmtLatency}
        />
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
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="db_connections_active"
          metric="db_connections_active"
          title="Conexiones a la base (activas)"
          format={fmtCount}
        />
      </Section>

      <Section title="Servicios de Signa">
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="r2_presign_latency"
          metric="r2_presign_latency"
          title="Latencia de firma de R2 (p95)"
          format={fmtLatency}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="email_failures"
          metric="email_failures"
          title="Fallos de email"
          format={fmtReqs}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="push_failures"
          metric="push_failures"
          title="Fallos de push"
          format={fmtReqs}
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

function MlInfra({ onSelectRange, ...perf }: InfraProps) {
  // Recognition hits/misses are real lesson data (camera block attempts), not Grafana — so the ML
  // board works locally too, unlike the Prometheus-backed inference latency panel.
  const business = useBusinessMetrics(perf.range, perf.live);
  const cameraTypes = (business.data?.accuracy.byBlockType ?? []).filter((b) =>
    CAMERA_BLOCK_TYPES.has(b.type),
  );
  const evaluated = cameraTypes.reduce((s, b) => s + b.evaluated, 0);
  const correct = cameraTypes.reduce((s, b) => s + b.correct, 0);
  const accuracy = evaluated ? Math.round((correct / evaluated) * 1000) / 10 : null;

  return (
    <div className="flex flex-col gap-6">
      <GoldenRow>
        <GoldenTile
          metric="recognition_accuracy"
          value={accuracy == null ? "—" : `${accuracy}%`}
          rawValue={accuracy}
          hint={`${NUMBER.format(correct)}/${NUMBER.format(evaluated)} aciertos`}
        />
        <GoldenTile metric="recognition_attempts" value={NUMBER.format(evaluated)} tone="neutral" />
        <PerfGoldenTile
          {...perf}
          widget="ml_inference_latency"
          metric="ml_inference_latency"
          format={fmtLatency}
        />
        <PerfGoldenTile
          {...perf}
          widget="ml_confidence"
          metric="ml_confidence"
          format={fmtPercent}
        />
        <PerfGoldenTile
          {...perf}
          widget="ml_inference_rate"
          metric="ml_inference_rate"
          format={fmtReqs}
        />
      </GoldenRow>

      <p className="text-text-muted text-[13px]">
        El reconocimiento corre <strong>en el dispositivo</strong>: su salud es independiente del
        backend. Si el backend está operativo pero estas métricas caen a cero (sin inferencias, FPS
        o confianza), el servicio de reconocimiento está degradado o caído aunque la API siga en
        pie.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="ml_inference_rate"
          metric="ml_inference_rate"
          title="Inferencias por segundo"
          subtitle="Volumen de reconocimiento (consumo de IA), reportado por la app"
          format={fmtReqs}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="ml_confidence"
          metric="ml_confidence"
          title="Confianza del modelo (promedio)"
          subtitle="Reportada por la app"
          format={fmtPercent}
        />
        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="ml_fps"
          metric="ml_fps"
          title="FPS de cámara (promedio)"
          subtitle="Reportado por la app"
          format={fmtCount}
        />
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Precisión por tipo de ejercicio con cámara</CardTitle>
            <InfoPopover metric="recognition_accuracy" className="ml-auto" />
          </div>
          <p className="text-text-muted -mt-1.5 text-[13px]">Menor precisión primero</p>
          {cameraTypes.length === 0 ? (
            <p className="text-text-muted text-sm">Sin ejercicios de cámara en este período.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {[...cameraTypes]
                .sort((x, y) => x.accuracyPercent - y.accuracyPercent)
                .map((b) => (
                  <li key={b.type} className="flex flex-col gap-1">
                    <div className="flex justify-between gap-2 text-[13px] font-bold">
                      <span className="truncate">{b.type}</span>
                      <span>
                        {b.accuracyPercent}% · {NUMBER.format(b.evaluated)} ej.
                      </span>
                    </div>
                    <ProgressBar percent={b.accuracyPercent} />
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <PerfPanel
          {...perf}
          onSelectRange={onSelectRange}
          widget="ml_inference_latency"
          metric="ml_inference_latency"
          title="Latencia de inferencia (p95)"
          subtitle="Reconocimiento en el dispositivo, reportado por la app"
          format={fmtLatency}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricStat
          metric="recognition_accuracy"
          value={accuracy == null ? "—" : `${accuracy}%`}
          hint={`${NUMBER.format(evaluated)} ejercicios`}
        />
      </div>

      <p className="text-text-muted text-[13px]">
        La precisión y los intentos salen de los ejercicios reales con cámara (datos de lecciones);
        la latencia, la confianza y el FPS los reporta la app por telemetría. El acierto por palabra
        queda pendiente: requiere asociar cada intento de cámara con la seña objetivo (hoy no está
        modelado).
      </p>
    </div>
  );
}
