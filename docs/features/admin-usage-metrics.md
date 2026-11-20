# Admin usage metrics (`/admin/usage-metrics`)

> Responsibility: the SIGNA back-office "Métricas de uso" dashboard — global app usage, organized by
> apartado (persona), with golden metrics, self-documenting widgets and an interactive time filter.
> Update when: a tab, widget, golden metric, the datetime picker, or the metrics API changes.
> Sources: src/app/(admin)/admin/usage-metrics/page.tsx, src/app/(admin)/admin/page.tsx, src/components/dashboard/{metrics-tabs,golden-row,kpi-card,delta,format,info-popover,metric-catalog,metric-stat,perf-chart,perf-panel,perf-format,breakdown-pie,daily-series-chart,revenue-by-source-chart,services-status,chart-kind,funnel,sign-reports-card,usage-queries,usage-math,usage-business,usage-resumen,usage-growth,usage-usuarios,usage-learning,usage-gamification,usage-infra}.ts(x), src/lib/{datetime-range,course-deep-link,api/metrics}.ts

A single screen for the whole app's usage — every user, with or without an organization — behind the
SIGNA `AdminAuthProvider` (not the org dashboard). One **datetime range picker** (hour/minute precision,
`<input type="datetime-local">`, rolling presets + custom) plus a **live** toggle drive every widget,
across every tab.

## Apartados (tabs)

Five tabs: **Resumen** (default), **Negocio**, **Usuarios**, **Aprendizaje**, **Infraestructura**. Gamification is not a tab: it is a section inside **Usuarios** (`GamificationSection`). The "v3 layout" section below is the current design; the bullets here describe what each tab contains.

- **Resumen** (`usage-resumen.tsx`) — four north-star `KpiCard`s (activos, nuevos, finalización de
  lecciones, ingresos netos) with deltas and sparklines; the daily active users chart (2/3 width) beside
  **"Requiere atención"** (`buildAlerts`: pending organizations → `/admin/organizations`, unresolved sign
  reports → `/admin/sign-reports`, low-use contracts → Negocio `#licencias`, the worst lesson abandonment →
  `/admin/courses?course=&lesson=`, email failures, failed imports); then the services strip
  (`services-status.tsx`; its "Ver infraestructura ›" action stays on the strip's line, only the service
  list wraps). Exercise success rate and the lessons-per-day chart live in Aprendizaje.
- **Learning funnel and sign reports** are **not** on this screen: the API computes both over the whole
  history (the funnel up to the window's end), so they ignore the period picker. They live on the admin
  home **`/admin`** (`src/app/(admin)/admin/page.tsx`), queried with `useLearningQuery` over
  `2020-01-01 → page open`, together with a **Usuarios registrados** counter taken from the funnel's first
  step (same universe as growth: no SIGNA staff). The funnel (`funnel.tsx`) and `SignReportsCard`
  (`sign-reports-card.tsx`) components are shared.

`page.tsx` is a shell holding the shared filter state (`selection`/`range`/`step`/`live`) and the active
tab. The active tab lives in the URL (`?tab=`), so an admin can bookmark their apartado. `MetricsTabs`
(`metrics-tabs.tsx`) is the accessible `role="tablist"`.

- **Negocio** (`usage-growth.tsx`) — the money. A **five-KPI north-star row** (`KpiCard`): **Ingresos
  netos** (org + usuarios finales, neto de reembolsos; compact `fmtMoneyCompact`, with the org/usuario
  split in its hint and an org-side period delta + sparkline), **Tasa de reembolso** (unificada, hint
  desglosa orgs vs usuarios), **Uso de cupos** (pp delta), **Ticket promedio org.** (pct delta from the
  previous window) and **Conversión a pago** (payers ÷ total users — `endUsers.payingUsers`). Then the
  stacked **Ingresos por fuente** chart (`RevenueBySourceChart`: organizaciones + gemas + cursos pagos).
  Below, two side-by-side panels: **Organizaciones** (a segmented status **pipeline** bar + legend —
  Activas/Pendientes/Suspendidas/Rechazadas — the pending-validation amber strip with "Validar", and
  usuarios/ingreso promedio por org + compras) and **Usuarios finales** (gem & paid-course money tiles,
  usuarios que compraron, ingreso por usuario pagador, and recompra 2+ from `endUsers.repeatBuyerPercent`).
  The `/admin/organizations` list has tabs Pendientes/Activas/Rechazadas/Suspendidas/Todas; "Todas"
  excludes suspended (dadas de baja) orgs, and a suspended org's detail panel offers "Reactivar
  organización" (`PATCH status: ACTIVE`). Suspending asks for a mandatory reason (shown in the panel of a suspended org), and rejected/suspended orgs get "Dar de baja" (confirmed inline, `DELETE`), which frees their emails.
  Finally the **per-org license utilization table** `OrgUtilizationTable` — contracted vs. used seats,
  activos 7 d, vence (coloured by `expiryTone`), ingresos and an **Estado** badge (Bajo uso / Vence pronto /
  Saludable / Sin cupos libres); ranked by risk, collapses to 6 rows behind a "Ver más (N)" toggle. Exposes
  `useGrowthMetrics` (shared with Usuarios).
- **Usuarios** (`usage-usuarios.tsx`) — "¿La gente usa Signa?": adquisición y actividad medidas sobre la
  ventana elegida. Range-based tasa de actividad (active/total, numerator/denominator), new users and active
  users each with a **period-over-period delta** (`Delta`, vs. the previous equal-length window; hidden for
  the whole history), total base al cierre,
  XP per active user (with its own period-over-period delta), and new/active-users time series; a **sessions** row — sesiones por usuario (frequency)
  and duración promedio de sesión (time spent) from app telemetry (`signa-mobile` `useSessionTracker` →
  `POST /sessions`), with a **usuarios conectados** chart (distinct users with the app open per bucket: each session is spread from its start to start+duration, so one user connected 15 min draws a plateau at 1). Then the **gamification** section (`GamificationSection` in
  `usage-gamification.tsx`): "¿La gamificación ayuda?" — **XP por usuario activo** (con el total como
  contexto), tasa de desbloqueo de logros, reclamo de desafíos, **tasa de canje de gemas**
  (gastadas en el período / gemas que los usuarios tienen hoy en su inventario); visualizaciones: **distribución de XP** por tramos (BreakdownPie) y **ranking de
  logros** más y menos desbloqueados (`AchievementRanking`); más daily XP/achievements/gems-spent.
  Rolling DAU/WAU/MAU + stickiness, current-streak tiles and the weekly-cohort retention table were removed
  (no reaccionaban al rango desde/hasta); the tab shows `retention7` (retention at 7 days of the window's signups) instead.
- **Aprendizaje** (`usage-learning.tsx`) — "¿La gente aprende LSA?": lesson flow (iniciadas/completadas +
  tasa de finalización) and exercise flow (realizados, tasa de éxito, intentos promedio); the **evolución
  de aciertos** daily chart beside precision by exercise type, then "Contenido a revisar". The funnel and
  sign reports moved to Resumen (historical, and they ignore the course picker); completion (per course, worst-first), enrollment-status
  donut, accuracy (global + per block type, worst-first), hardest lessons; a **dificultad y calidad** section
  — lessons by abandonment and exercises by error rate / retries (`ExerciseRanking`); vocabulary, sign-report
  resolution + most-reported signs, imports. Timing-per-lesson/exercise and weighted avg progress are not yet
  calculable (no stored timing) and are intentionally omitted.
- **Infraestructura** (`usage-infra.tsx`) — services strip, then **Backend** directly (no sub-tabs). **Backend** grouped into **API · HTTP** (latency p95/p99, throughput, 4xx/5xx, slowest ops) and **Sistema y recursos** (CPU/mem host + containers, JVM heap/GC — collapsed). The recognition accuracy KPI (camera exercises) is shown in the Backend KPI row. Web / Landing and ML · reconocimiento sub-tabs were removed.

`GoldenTile` (`golden-row.tsx`) is the headline tile that signals a metric's health at a glance, coloured success/warning/danger from the metric's `threshold`; today it is used by the Infraestructura perf tiles (`PerfGoldenTile` in `perf-panel.tsx`), while the other tabs open with `KpiCard`s (v3 layout below). Perf (Prometheus/Grafana)
panels only populate in production; the Infra tab says so, and shows "sin datos" locally.

## v3 layout (mockups, nov 2026)

- **Every KPI has the same anatomy** (`KpiCard`): value, a ▲/▼ delta pill vs. the previous
  equal-length window (`delta.tsx`: `pct`/`pp`/`abs` modes, `good: up|down` colours the change as
  good or bad news, es-AR comma), hint and sparkline. Health KPIs pass `toneValue` → dot + coloured
  value from the catalog threshold. Previous windows come from the same endpoints queried with
  `previousRange(range)` (`usage-queries.ts`), no extra API.
- **Período anterior** is drawn dashed on `DailySeriesChart` (`previous` prop) and `PerfChart`
  (`previous` + `previousShiftSeconds`).
- **Tabs** carry health dots (Aprendizaje: completion/success; Infraestructura: services) and the
  "Comparando con … · horario UTC" caption on the same row.
- **Resumen** (see the tab bullet above for the current layout): "Requiere atención" (`buildAlerts`): pending orgs, pending reports (top sign), low-use
  contracts (→ Negocio `#licencias`), worst lesson abandonment ≥ 40 % (deep link
  `/admin/courses?course=&lesson=`, `lib/course-deep-link.ts`), email failures, failed imports.
  `ServicesStrip` (`services-status.tsx`): API/R2 availability (avg of `avg_over_time(up)`),
  email/push failure counts (Σ rate × step), on-device recognition.
- **Usuarios**: retention at 7 days of the window's signups (`retention7`), cohort table removed;
  gamification is one stat strip + XP histogram (XP earned in the window, API tiers 0–100 … 2k+),
  challenge claims, achievements Más/Menos (share of `eligibleUsers`).
- **Funnel** (`funnel.tsx`): `funnelPath` drops a step fewer people reach than a later one (reading-only
  lessons complete without exercises, which used to print "108% sigue"); every transition reads
  "↓ N% sigue" and the biggest drop is red ("· mayor caída").
- **Aprendizaje**: single course picker, "Contenido a revisar" from
  `lessonsToReview` (API: course, abandonment, accuracy, attempts ≥ 30, pending reports per lesson).
- **Infraestructura**: Backend KPIs are window averages (peak in hint); 4xx+5xx and p95+p99 share a
  chart; slow ops table with per-endpoint req/s (`endpoint_rate` widget); "Sistema y recursos" collapsed (CPU, mem, containers, JVM heap — 5 panels).
- Designer "Notas de diseño" boxes in the mockups are annotations, not UI.
- Sparklines are omitted where no faithful series exists (refund rate, seat use, conversion,
  sessions, lesson completion).

## Self-documenting widgets

`metric-catalog.ts` is the single source of per-metric copy: `label`, `description` (what it is),
`howComputed` (how the number is worked out, in **plain language — no code, table or column names**, so
anyone can read it), `goodWhen` (what healthy looks like) and an optional `threshold`. Every golden tile (`GoldenTile`), stat (`MetricStat`) and perf chart (`PerfChart`, via its
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
"sin datos" (Prometheus scrapes every 60 s). Each time-series widget has its **own line/bar toggle**
(`ChartKindToggle` in `chart-kind.tsx`, a local `useState` per chart, in the card header) — there is no
page-level toggle. `DailySeriesChart` takes the active `range` and lays out **every** bucket of the period
on the x axis (gaps filled with 0, or "sin datos"/null for rates via `emptyAsNull`), at a resolution that
follows the window (minute/hour/day, or forced day via `dayResolution` for the day-only Learning/
Gamification series); the y axis is labelled with values.

## Data sources (two, one picker)

- **Business** → `metricsApi.business({ from, to })` → signa-api `GET /admin/metrics/business`, aggregated
  from Postgres. Shared via `useBusinessMetrics` (`usage-business.tsx`); consumed by the Negocio and
  Aprendizaje tabs (one cached fetch per range).
- **Growth** → `metricsApi.growth({ from, to })` → signa-api `GET /admin/metrics/growth`, aggregated from
  Postgres: audience (signups + total), engagement (DAU/WAU/MAU + stickiness), waitlist, B2B revenue and
  refunds, the gem economy, seat utilization and organizations by status, with **adaptive-resolution**
  series (each point's `t` is the bucket's start instant — see Resolution below). Powers the Resumen, Negocio and Usuarios tabs
  (`usage-resumen.tsx`, `usage-growth.tsx`, `usage-usuarios.tsx`), alongside enrollment state from the business endpoint.
- **Learning** → `metricsApi.learning({ from, to })` → signa-api `GET /admin/metrics/learning`, aggregated
  from Postgres: per-course completion, the enrollment funnel, the hardest lessons by accuracy, vocabulary
  growth (daily), sign-report resolution + most-reported signs, and content-import health. Powers the
  Aprendizaje tab (`usage-learning.tsx`), alongside accuracy/report state from the business endpoint.
- **Gamification** → `metricsApi.gamification({ from, to })` → signa-api `GET /admin/metrics/gamification`,
  aggregated from Postgres: daily XP, streak distribution, achievements unlocked (+ top), challenge claim
  rates by type, gifts and the shop economy. Powers the gamification section of Usuarios (`usage-gamification.tsx`).
- **Performance / infra** → `metricsApi.perf(widget, { from, to, step })` → signa-api
  `GET /admin/metrics/perf/{widget}`, which proxies PromQL `query_range` to Grafana Cloud. Rendered by
  `PerfChart` via `PerfPanel`/`PerfGoldenTile` (`perf-panel.tsx`); value formatters in `perf-format.ts`.

The picker emits a `RangeSelection` (`datetime-range.ts`); the page resolves it to ISO instants and a
suggested `step` (`deriveStepSeconds`). While **live**, rolling presets re-anchor to "now" every 30 s and
all TanStack queries (`refetchInterval`) refresh. Query keys: `["admin","metrics",<kind>,…,from,to,step]`.

## Notes & limits

- **Universe:** every Usuarios metric (new, total, activation, active, sessions) counts accounts that are not
  `Role.ADMIN` (SIGNA staff). The "% de usuarios totales" under active users uses the same growth `users.total`.
  XP windows are by UTC calendar day, end-exclusive, and the previous window shares no day with the current.
- **Active user:** a distinct learner (`Role.USER`) with _any_ authenticated activity in the app in the
  window (exercises, friends, shop, boosters, …), not just exercise attempts. `signa-api` records a
  throttled `user_activity` row (≤1/min/user) from `JwtAuthFilter`; counts are `COUNT(DISTINCT user)`, so
  20 connections in an hour = 1 active user. Backfilled from attempts and sessions.
- **Sessions:** `signa-mobile` re-sends the running session every 30 s (same `sessionId`, server upserts
  and keeps the max duration), so sessions appear without having to background the app.

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
