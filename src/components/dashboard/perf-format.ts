import type { ValueFormat } from "@/components/dashboard/perf-chart";

/**
 * Shared value formatters for the usage dashboard. Prometheus latency buckets are in seconds, so
 * latency formatters switch to milliseconds under a second. Kept here (not in a component) so every
 * tab and the metric catalog format the same metric the same way.
 */

/** Fixed decimals with the Argentine comma (UI copy is es-AR). */
function dec(v: number, digits: number): string {
  return v.toLocaleString("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export const fmtLatency: ValueFormat = (v) =>
  v >= 1 ? `${dec(v, 2)} s` : `${Math.round(v * 1000)} ms`;

/** A Prometheus ratio (0–1) shown as a percentage. */
export const fmtPercentRatio: ValueFormat = (v) => `${dec(v * 100, 1)}%`;

/** An already-percentage value (0–100). */
export const fmtPercent: ValueFormat = (v) => `${dec(v, 0)}%`;

export const fmtPercent1: ValueFormat = (v) => `${dec(v, 1)}%`;

export const fmtReqs: ValueFormat = (v) => `${dec(v, 2)}/s`;

/** Requests per second for headline figures: "38 req/s", "0,4 req/s" under one. */
export const fmtReqsShort: ValueFormat = (v) =>
  v >= 10 ? `${Math.round(v).toLocaleString("es-AR")} req/s` : `${dec(v, 1)} req/s`;

/** Requests per second (raw from Prometheus) converted to per-minute for display. */
export const fmtReqsPerMinute: ValueFormat = (v) => {
  const rpm = v * 60;
  return rpm >= 10
    ? `${Math.round(rpm).toLocaleString("es-AR")} req/min`
    : `${dec(rpm, 1)} req/min`;
};

/** Per-endpoint rate for tables: "4,1/s". */
export const fmtRate1: ValueFormat = (v) => `${dec(v, 1)}/s`;

export const fmtCount: ValueFormat = (v) => v.toLocaleString("es-AR");

export const fmtCores: ValueFormat = (v) => dec(v, 2);

export const fmtBytes: ValueFormat = (v) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = v;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${dec(n, 1)} ${units[i]}`;
};

/** Argentine peso, no decimals (B2B revenue). */
export const fmtMoney: ValueFormat = (v) =>
  v.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/**
 * Compact pesos for headline aggregates: "$13,77 M", "$847 k", "$20,5 k". Keeps two decimals in the
 * millions and one below $100 k, so amounts shown side by side still add up ($20,5 k + $5,5 k =
 * $26 k, where whole thousands read "$21 k + $6 k") and chart ticks do not round onto each other
 * ($2,5 k read "$3 k"); falls back to {@link fmtMoney} below a thousand.
 */
export const fmtMoneyCompact: ValueFormat = (v) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000)
    return `$${(v / 1_000_000).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} M`;
  if (abs >= 1_000)
    return `$${(v / 1_000).toLocaleString("es-AR", {
      maximumFractionDigits: abs >= 100_000 ? 0 : 1,
    })} k`;
  return fmtMoney(v);
};
