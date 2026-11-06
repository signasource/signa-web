# Admin usage metrics (`/admin/usage-metrics`)

> Responsibility: the SIGNA back-office "Métricas de uso" dashboard — global app usage, organized by
> apartado (persona), with golden metrics, self-documenting widgets and an interactive time filter.
> Update when: a tab, widget, golden metric, the datetime picker, or the metrics API changes.
> Sources: src/app/(admin)/admin/usage-metrics/page.tsx, src/components/dashboard/{metrics-tabs,golden-row,info-popover,metric-catalog,metric-stat,perf-chart,perf-panel,perf-format,breakdown-pie,daily-series-chart,chart-kind,funnel,usage-business,usage-growth,usage-usuarios,usage-learning,usage-gamification,usage-infra}.tsx, src/lib/{datetime-range,api/metrics}.ts

A single screen for the whole app's usage — every user, with or without an organization — behind the
SIGNA `AdminAuthProvider` (not the org dashboard). One **datetime range picker** (hour/minute precision,
`<input type="datetime-local">`, rolling presets + custom) plus a **live** toggle drive every widget,
across every tab.

## Apartados (sub-tabs)

`page.tsx` is a shell holding the shared filter state (`selection`/`range`/`step`/`live`) and the active
tab. The active tab lives in the URL (`?tab=`), so an admin can bookmark their apartado. `MetricsTabs`
(`metrics-tabs.tsx`) is the accessible `role="tablist"`.

- **Negocio** (`usage-growth.tsx`) — the money, grouped **sin organización** (gem purchases, users on paid
  courses) vs **organizaciones** (B2B revenue/refunds, seats, org status donut, revenue series, pipeline:
  orgs nuevas, usuarios & ingreso promedio por org, compras, and the **per-org license utilization table**
  `OrgUtilizationTable` — contracted vs. used seats, amber when a big contract is under-used; collapses to 6
  rows behind a "Ver más (N)" toggle). Exposes `useGrowthMetrics` (shared with Usuarios).
- **Usuarios** (`usage-usuarios.tsx`) — "¿La gente usa Signa?": adquisición y actividad medidas sobre la
  ventana elegida. Range-based tasa de actividad (active/total, numerator/denominator), new users and active
  users each with a **period-over-period delta** (`Delta`, vs. the previous equal-length window; hidden for
  the whole history), tasa de activación (new users who made an attempt / new users), total base al cierre,
  XP per active user, and new/active-users time series; a **sessions** row — sesiones por usuario (frequency)
  and duración promedio de sesión (time spent) from app telemetry (`signa-mobile` `useSessionTracker` →
  `POST /sessions`), with a sessions chart. Then the **gamification** section (`GamificationSection` in
  `usage-gamification.tsx`): "¿La gamificación ayuda?" — **XP por usuario activo** (con el total como
  contexto), tasa de desbloqueo de logros, reclamo de desafíos, **tasa de canje de gemas**
  (gastadas/acreditadas); visualizaciones: **distribución de XP** por tramos (BreakdownPie) y **ranking de
  logros** más y menos desbloqueados (`AchievementRanking`); más daily XP/achievements/gems-spent.
  Rolling DAU/WAU/MAU + stickiness, current-streak tiles and the weekly-cohort retention table were removed
  (no reaccionaban al rango desde/hasta).
- **Aprendizaje** (`usage-learning.tsx`) — "¿La gente aprende LSA?": lesson flow (iniciadas/completadas +
  tasa de finalización) and exercise flow (realizados, tasa de éxito, intentos promedio); the **embudo de
  aprendizaje** (`funnel.tsx`: registrados → iniciaron lección → hicieron ejercicio → completaron lección →
  2+) and the **evolución de aciertos** daily chart; completion (per course, worst-first), enrollment-status
  donut, accuracy (global + per block type, worst-first), hardest lessons; a **dificultad y calidad** section
  — lessons by abandonment and exercises by error rate / retries (`ExerciseRanking`); vocabulary, sign-report
  resolution + most-reported signs, imports. Timing-per-lesson/exercise and weighted avg progress are not yet
  calculable (no stored timing) and are intentionally omitted.
- **Infraestructura** (`usage-infra.tsx`) — inner sub-tabs. **Backend** grouped into **API · HTTP**
  (latency p95/p99, throughput, 4xx/5xx, slowest ops), **Sistema y recursos** (CPU/mem host + containers,
  JVM heap/GC, DB connections) and **Servicios de Signa** (R2 presign, mail/push failures). **Web / Landing**
  (web vitals, animation + screen load, client errors). **ML** — recognition accuracy + per-camera-block-type
  accuracy from real lesson attempts (`VISUAL_RECOGNITION`/`PERFORM_SIGN`/`SPELL_NAME`), plus inference
  latency p95, model confidence, camera FPS and **inference volume** (`ml_inference_rate` = consumo de IA)
  from telemetry. Recognition runs **on-device**, so its health is independent of the backend — the sub-tab
  calls this out: if the API is up but these metrics fall to zero, recognition is down. There is no AI error
  rate or server cost (on-device). Per-word accuracy is reserved (needs a camera-attempt → sign mapping that
  isn't modelled).

Each tab opens with a **GoldenRow** (`golden-row.tsx`): 3–5 headline tiles that signal the area's health
at a glance, coloured success/warning/danger from the metric's `threshold`. Perf (Prometheus/Grafana)
panels only populate in production; the Infra tab says so, and shows "sin datos" locally.

## Self-documenting widgets

`metric-catalog.ts` is the single source of per-metric copy: `label`, `description` (what it is),
`howComputed` (where the number comes from), `goodWhen` (what healthy looks like) and an optional
`threshold`. Every golden tile (`GoldenTile`), stat (`MetricStat`) and perf chart (`PerfChart`, via its
`metric` prop) carries an `InfoPopover` ("i" button) that reads from this catalog, so the dashboard is
understandable with no prior context. `toneFor(value, threshold)` maps a value to its tone. The popover
renders in a **portal** with fixed positioning (not `absolute` inside the card): the cards keep their own
stacking context from the `dash-card-enter` transform, so an in-card panel would be painted behind later
cards. Status distributions use `BreakdownPie` (`breakdown-pie.tsx`), a donut with a count/share legend.

## Interactive time filter (brush → global range)

Dragging across any `PerfChart` line chart draws a `ReferenceArea` and, on release, calls `onSelectRange`
with the selected `[from, to]` seconds; clicking a day bar in `DailyActivityChart` selects that whole day.
The page turns that into a `{ kind: "custom", from, to }` `RangeSelection`, which re-runs **every** widget
(their query keys include `from/to`). No extra plumbing: the shared filter already propagates. A tiny
selection is widened to a minimum span (`MIN_SPAN_SECONDS`, 5 min) so focusing on a spike never reads as
"sin datos" (Prometheus scrapes every 60 s). A page-level **line/bar toggle** (`ChartKindContext`, header
control) switches every time-series widget between a line and bars at once.

## Data sources (two, one picker)

- **Business** → `metricsApi.business({ from, to })` → signa-api `GET /admin/metrics/business`, aggregated
  from Postgres. Shared via `useBusinessMetrics` (`usage-business.tsx`); consumed by the Negocio and
  Aprendizaje tabs (one cached fetch per range).
- **Growth** → `metricsApi.growth({ from, to })` → signa-api `GET /admin/metrics/growth`, aggregated from
  Postgres: audience (signups + total), engagement (DAU/WAU/MAU + stickiness), waitlist, B2B revenue and
  refunds, the gem economy, seat utilization and organizations by status, with **adaptive-resolution**
  series (each point's `t` is the bucket's start instant — see Resolution below). Powers the Negocio tab
  (`usage-growth.tsx`), alongside enrollment state from the business endpoint.
- **Learning** → `metricsApi.learning({ from, to })` → signa-api `GET /admin/metrics/learning`, aggregated
  from Postgres: per-course completion, the enrollment funnel, the hardest lessons by accuracy, vocabulary
  growth (daily), sign-report resolution + most-reported signs, and content-import health. Powers the
  Aprendizaje tab (`usage-learning.tsx`), alongside accuracy/report state from the business endpoint.
- **Gamification** → `metricsApi.gamification({ from, to })` → signa-api `GET /admin/metrics/gamification`,
  aggregated from Postgres: daily XP, streak distribution, achievements unlocked (+ top), challenge claim
  rates by type, gifts and the shop economy. Powers the Gamificación tab (`usage-gamification.tsx`).
- **Performance / infra** → `metricsApi.perf(widget, { from, to, step })` → signa-api
  `GET /admin/metrics/perf/{widget}`, which proxies PromQL `query_range` to Grafana Cloud. Rendered by
  `PerfChart` via `PerfPanel`/`PerfGoldenTile` (`perf-panel.tsx`); value formatters in `perf-format.ts`.

The picker emits a `RangeSelection` (`datetime-range.ts`); the page resolves it to ISO instants and a
suggested `step` (`deriveStepSeconds`). While **live**, rolling presets re-anchor to "now" every 30 s and
all TanStack queries (`refetchInterval`) refresh. Query keys: `["admin","metrics",<kind>,…,from,to,step]`.

## Notes & limits

- **Resolution:** the **Growth** series (`SeriesCount`/`SeriesAmount` with a `t` instant) are
  **adaptive**: signa-api buckets them by `floor(epoch/bucket)` with `bucket = MetricsRange.bucketSeconds()`
  (minute if the span ≤ 6 h, hour if ≤ 3 d, else day), so a 30-minute window reads minute-by-minute and a
  30-day window day-by-day. `DailySeriesChart` infers the unit from the point spacing (time label for
  sub-day, date for day) and formats in **UTC** (the bucket boundary). Learning/Gamification series stay
  **day** resolution (`DailyCount` with a `day`; XP comes from `UserDailyXp.xpDate`, a calendar day).
- **Grafana token:** performance panels need a Grafana Cloud `metrics:read` token on the server
  (`GRAFANA_CLOUD_PROM_*`). Without it the backend returns `available:false` and panels show "sin datos";
  the business tabs keep working.
- Colors come from tokens only (`perf-chart.tsx` palette); every chart has a text-alternative summary and
  handles loading / empty / error / unavailable.
