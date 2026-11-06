import type { ValueFormat } from "@/components/dashboard/perf-chart";

/**
 * Shared value formatters for the usage dashboard. Prometheus latency buckets are in seconds, so
 * latency formatters switch to milliseconds under a second. Kept here (not in a component) so every
 * tab and the metric catalog format the same metric the same way.
 */

export const fmtLatency: ValueFormat = (v) =>
  v >= 1 ? `${v.toFixed(2)} s` : `${Math.round(v * 1000)} ms`;

/** A Prometheus ratio (0–1) shown as a percentage. */
export const fmtPercentRatio: ValueFormat = (v) => `${(v * 100).toFixed(1)}%`;

/** An already-percentage value (0–100). */
export const fmtPercent: ValueFormat = (v) => `${v.toFixed(0)}%`;

export const fmtPercent1: ValueFormat = (v) => `${v.toFixed(1)}%`;

export const fmtReqs: ValueFormat = (v) => `${v.toFixed(2)}/s`;

export const fmtCount: ValueFormat = (v) => v.toLocaleString("es-AR");

export const fmtCores: ValueFormat = (v) => v.toFixed(2);

export const fmtBytes: ValueFormat = (v) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = v;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(1)} ${units[i]}`;
};

/** Argentine peso, no decimals (B2B revenue). */
export const fmtMoney: ValueFormat = (v) =>
  v.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
