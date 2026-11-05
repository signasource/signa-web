# Admin usage metrics (`/admin/usage-metrics`)

> Responsibility: the SIGNA back-office "Métricas de uso" dashboard — global app usage, Datadog-style.
> Update when: a widget, the datetime picker, or the metrics API changes.
> Sources: src/app/(admin)/admin/usage-metrics/page.tsx, src/components/dashboard/{datetime-range-picker,perf-chart,usage-business}.tsx, src/lib/{datetime-range,api/metrics}.ts

A single screen for the whole app's usage — every user, with or without an organization — behind the
SIGNA `AdminAuthProvider` (not the org dashboard). One **datetime range picker** (hour/minute precision,
`<input type="datetime-local">`, rolling presets + custom) plus a **live** toggle drive every widget.

## Data sources (two, one picker)

- **Business** → `metricsApi.business({ from, to })` → signa-api `GET /admin/metrics/business`, aggregated
  from Postgres (global analog of the org `OrganizationMetricsRepository`). State snapshots + a daily
  activity series. Rendered by `BusinessSection` (`usage-business.tsx`).
- **Performance / infra** → `metricsApi.perf(widget, { from, to, step })` → signa-api
  `GET /admin/metrics/perf/{widget}`, which proxies PromQL `query_range` to Grafana Cloud. Rendered by
  the generic `PerfChart` (`perf-chart.tsx`) via `PerfPanel`/`HealthTile` wrappers in the page.

The picker emits a `RangeSelection` (`datetime-range.ts`); the page resolves it to ISO instants and a
suggested `step` (`deriveStepSeconds`). While **live**, rolling presets re-anchor to "now" every 30 s and
all TanStack queries (`refetchInterval`) refresh. Query keys: `["admin","metrics",<kind>,…,from,to,step]`.

## Widgets

- **Salud**: backend up, R2 up, latency p95, error rate, CPU/mem host (latest value tiles).
- **Negocio**: users (total/active), courses, published versions, enrollments in progress, lessons/topics
  completed, global accuracy; a daily-activity bar chart; breakdowns (enrollments, versions, sign reports
  by status; pending reports; failed imports); accuracy by block type.
- **Performance**: HTTP latency p95/p99, throughput, error rate, slowest operations, host CPU/mem,
  per-container CPU/mem, DB connections, R2 presign latency, animation latency.

## Notes & limits

- **Resolution:** business throughput/error time series are best read from the performance (Prometheus)
  panels at hour/minute resolution; the business endpoint's own activity series is **day** resolution
  (`UserDailyActivity` and attempt buckets are per Argentina day).
- **Grafana token:** performance panels need a Grafana Cloud `metrics:read` token on the server
  (`GRAFANA_CLOUD_PROM_*`). Without it the backend returns `available:false` and panels show "sin datos";
  the business dashboard keeps working.
- Colors come from tokens only (`perf-chart.tsx` palette); every chart has a text-alternative summary and
  handles loading / empty / error / unavailable.
