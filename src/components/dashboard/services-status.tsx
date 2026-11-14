"use client";

import type { MetricTone } from "@/components/dashboard/metric-catalog";
import { Card } from "@/components/dashboard/ui";
import { perfAverage, perfTotal, seriesLatest } from "@/components/dashboard/usage-math";
import { usePerfWidget } from "@/components/dashboard/usage-queries";
import type { DateTimeRange } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

export type ServiceItem = { key: string; label: string; detail: string; tone: MetricTone };

const DOT: Record<MetricTone, string> = {
  success: "bg-success",
  warning: "bg-streak-orange",
  danger: "bg-danger",
  neutral: "bg-text-muted",
};

const RANK: Record<MetricTone, number> = { neutral: 0, success: 1, warning: 2, danger: 3 };

/** The worst tone among several (neutral = no data, never worse than a real signal). */
export function worstTone(tones: MetricTone[]): MetricTone {
  return tones.reduce<MetricTone>((w, t) => (RANK[t] > RANK[w] ? t : w), "neutral");
}

/** Availability over the window (0–100) from a 1/0 "up" series, as "99,98%". */
export function uptimeItem(key: string, label: string, avg: number | null): ServiceItem {
  if (avg == null) return { key, label, detail: "sin datos", tone: "neutral" };
  const pct = Math.floor(avg * 10_000) / 100;
  const detail = `${pct.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const tone: MetricTone = pct >= 99.9 ? "success" : pct >= 99 ? "warning" : "danger";
  return { key, label, detail, tone };
}

/** Failures counted over the window: none is healthy, a few warn, many are an incident. */
export function failuresItem(key: string, label: string, total: number | null): ServiceItem {
  if (total == null) return { key, label, detail: "sin datos", tone: "neutral" };
  const detail = `${total.toLocaleString("es-AR")} ${total === 1 ? "fallo" : "fallos"}`;
  const tone: MetricTone = total === 0 ? "success" : total < 10 ? "warning" : "danger";
  return { key, label, detail, tone };
}

/**
 * Health of the services over the selected window: API and storage availability, email and push
 * failures, and on-device recognition (alive when the app keeps reporting inferences).
 */
export function useServiceStatus(range: DateTimeRange, step: number, live: boolean) {
  const api = usePerfWidget("backend_up", range, step, live);
  const r2 = usePerfWidget("r2_up", range, step, live);
  const email = usePerfWidget("email_failures", range, step, live);
  const push = usePerfWidget("push_failures", range, step, live);
  const ml = usePerfWidget("ml_inference_rate", range, step, live);

  const mlRate = ml.data?.available ? seriesLatest(ml.data.series[0]) : null;
  const items: ServiceItem[] = [
    uptimeItem("api", "API", perfAverage(api.data)),
    uptimeItem("r2", "Almacenamiento", perfAverage(r2.data)),
    failuresItem("email", "Emails", perfTotal(email.data)),
    failuresItem("push", "Notificaciones", perfTotal(push.data)),
    mlRate == null
      ? { key: "ml", label: "Reconocimiento", detail: "sin datos", tone: "neutral" }
      : {
          key: "ml",
          label: "Reconocimiento",
          detail: mlRate > 0 ? "en uso" : "sin inferencias",
          tone: mlRate > 0 ? "success" : "warning",
        },
  ];
  const unavailable = [api, r2, email, push].every((q) => q.data && !q.data.available);
  return {
    items,
    tone: worstTone(items.map((i) => i.tone)),
    unavailable,
    isPending: api.isPending,
    emailFailures: perfTotal(email.data),
  };
}

/** One-line services strip: a dot, name and figure per service, plus an optional action. */
export function ServicesStrip({
  items,
  unavailable,
  action,
}: {
  items: ServiceItem[];
  unavailable?: boolean;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <Card className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5">
      <p className="text-sm font-extrabold">Estado de servicios</p>
      {unavailable ? (
        <p className="text-text-muted text-[13px]">
          Sin datos: falta configurar el acceso de lectura a Grafana Cloud.
        </p>
      ) : (
        items.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5 text-[13px]">
            <span className={cn("size-2 rounded-full", DOT[item.tone])} aria-hidden />
            <span className="font-extrabold">{item.label}</span>
            <span className="text-text-muted">{item.detail}</span>
          </span>
        ))
      )}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="text-primary hover:text-primary-dark ml-auto cursor-pointer text-[13px] font-extrabold"
        >
          {action.label}
        </button>
      ) : null}
    </Card>
  );
}
