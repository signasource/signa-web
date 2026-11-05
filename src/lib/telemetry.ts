/**
 * Lightweight client RUM for signa-web. Batches events and ships them to signa-api
 * `POST /telemetry/events` (public, best-effort), which records them as bounded Micrometer metrics
 * that flow through the existing Alloy→Grafana pipeline and the usage dashboard's perf panels.
 *
 * Deliberately dependency-free (native PerformanceObserver), snake_case on the wire to match the
 * API's Jackson naming, and fire-and-forget: a telemetry failure must never affect the page.
 */
import { env } from "@/lib/env";

type WireEvent = {
  platform: "web";
  type: "web_vital" | "screen_load" | "client_error" | "api_error";
  name?: string;
  value_ms?: number;
  status?: "ok" | "error";
};

const MAX_BATCH = 50;
const FLUSH_MS = 15_000;

let queue: WireEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;

function scheduleFlush(): void {
  if (timer) return;
  timer = setTimeout(flush, FLUSH_MS);
}

function flush(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0 || typeof navigator === "undefined") return;
  const events = queue.slice(0, MAX_BATCH);
  queue = queue.slice(MAX_BATCH);
  const url = `${env.apiUrl}/telemetry/events`;
  const body = JSON.stringify({ events });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // ignore: telemetry is best-effort
  }
  if (queue.length > 0) scheduleFlush();
}

function enqueue(event: WireEvent): void {
  queue.push(event);
  scheduleFlush();
}

/** A web vital sample (LCP/CLS/FCP/TTFB/INP), in ms (CLS is scaled to a positive ms-like number). */
export function trackWebVital(name: string, valueMs: number): void {
  enqueue({ platform: "web", type: "web_vital", name, value_ms: Math.max(0, Math.round(valueMs)) });
}

/** Time a named screen/route took to become interactive, in ms. */
export function trackScreenLoad(name: string, valueMs: number): void {
  enqueue({
    platform: "web",
    type: "screen_load",
    name,
    value_ms: Math.max(0, Math.round(valueMs)),
  });
}

/** A client-side error, bucketed to a bounded category by the backend. */
export function trackClientError(category = "unknown"): void {
  enqueue({ platform: "web", type: "client_error", name: category, status: "error" });
}

/** A failed API call, by HTTP status class. */
export function trackApiError(status: number): void {
  enqueue({
    platform: "web",
    type: "api_error",
    name: status >= 500 ? "http_5xx" : "http_4xx",
    status: "error",
  });
}

/** Wires the native PerformanceObserver vitals + error listeners. Idempotent. */
export function initTelemetry(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  observe("largest-contentful-paint", (entries) => {
    const last = entries[entries.length - 1] as PerformanceEntry | undefined;
    if (last) latestLcp = last.startTime;
  });

  observe("paint", (entries) => {
    const fcp = entries.find((e) => e.name === "first-contentful-paint");
    if (fcp) trackWebVital("FCP", fcp.startTime);
  });

  observe("layout-shift", (entries) => {
    for (const entry of entries as (PerformanceEntry & {
      value?: number;
      hadRecentInput?: boolean;
    })[]) {
      if (!entry.hadRecentInput && typeof entry.value === "number") cls += entry.value;
    }
  });

  // TTFB from the navigation timing entry.
  const nav = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  if (nav) trackWebVital("TTFB", nav.responseStart);

  window.addEventListener("error", () => trackClientError("render"));
  window.addEventListener("unhandledrejection", () => trackClientError("unknown"));

  // Finalize the "final value" vitals (LCP, CLS) and flush when the page is hidden/unloaded.
  const finalize = () => {
    if (latestLcp != null) {
      trackWebVital("LCP", latestLcp);
      latestLcp = null;
    }
    if (cls > 0) {
      trackWebVital("CLS", cls * 1000);
      cls = 0;
    }
    flush();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") finalize();
  });
  window.addEventListener("pagehide", finalize);
}

let latestLcp: number | null = null;
let cls = 0;

function observe(type: string, cb: (entries: PerformanceEntry[]) => void): void {
  try {
    const observer = new PerformanceObserver((list) => cb(list.getEntries()));
    observer.observe({ type, buffered: true });
  } catch {
    // Unsupported entry type in this browser: skip that vital.
  }
}
