# Admin usage metrics (`/admin/usage-metrics`)

> Responsibility: the SIGNA back-office "Métricas de uso" dashboard — global app usage, organized by
> apartado (persona), with golden metrics, self-documenting widgets and an interactive time filter.
> Update when: a tab, widget, golden metric, the datetime picker, or the metrics API changes.
> Sources: src/app/(admin)/admin/usage-metrics/page.tsx, src/app/(admin)/admin/page.tsx, src/components/dashboard/{metrics-tabs,golden-row,kpi-card,delta,format,info-popover,metric-catalog,metric-stat,perf-chart,perf-panel,perf-format,breakdown-pie,daily-series-chart,revenue-by-source-chart,services-status,chart-kind,funnel,sign-reports-card,sales-math,sales-list-dialog,survey-bar-chart,survey-answers,usage-queries,usage-math,usage-business,usage-resumen,usage-growth,usage-usuarios,usage-learning,usage-infra}.ts(x), src/lib/{datetime-range,course-deep-link,refund-reasons,api/metrics}.ts

A single screen for the whole app's usage — every user, with or without an organization — behind the
SIGNA `AdminAuthProvider` (not the org dashboard). One **datetime range picker** (hour/minute precision,
`<input type="datetime-local">`, rolling presets + custom) plus a **live** toggle drive every widget,
across every tab.

## Apartados (tabs)

Five tabs: **Resumen** (default), **Negocio**, **Usuarios**, **Aprendizaje**, **Infraestructura**. Gamification is not a tab: it is a section inside **Usuarios** (`GamificationSection`). The "v3 layout" section below is the current design; the bullets here describe what each tab contains.

- **Resumen** (`usage-resumen.tsx`) — four north-star `KpiCard`s (activos, nuevos, finalización de
  lecciones, ingresos — sin compras reembolsadas, split orgs/usuarios finales in the hint) with deltas; the daily active users chart (2/3 width) beside
  **"Requiere atención"** (`buildAlerts`: pending organizations → `/admin/organizations`, unresolved sign
  reports → `/admin/sign-reports`, low-use contracts → `/admin/organizations`, the worst lesson abandonment →
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

- **Negocio** (`usage-growth.tsx`) — the money, per the business sheet (nov 2026). Counters
  (`KpiCard`, no hint text) beside their breakdown (`KpiBeside`, stacks on narrow screens), in this
  order: **Ingresos** (purchases paid in the window that were **not** refunded) beside the stacked
  **Ingresos por fuente** chart (`RevenueBySourceChart`: organizaciones + gemas + cursos pagos; no
  subtitle and a 150 px plot, so the row stays short); **Tasa de reembolsos** (**by count**: refunded
  ÷ all purchases of the window), **Motivos de reembolso** (`BreakdownPie` of the refunded
  purchases by reason, labels from `refundReasonLabel`) and **Origen de las gemas** as one row of
  three. Both rows share one grid (`NEGOCIO_COLUMNS`: column 1 for the counters, the chart
  `wide` across columns 2–3), so Ingresos and Tasa de reembolsos have the same width; two columns
  on medium screens. `BreakdownPie` stacks its legend under the donut in a narrow card; **Cursos más populares** (per course: org
  seats activated in the window + individuals = paid orders not refunded + free self-enrollments;
  sorted by total) and **Ingresos por curso** (seats + individual orders, no refunds, no gems;
  organizaciones / individuales / total) as two equal halves. Origen de las gemas reads `gemSources` (desafíos / logros / compradas). There
  is no "Dinero reembolsado" card (removed nov 2026). The counters come from `GET
/admin/metrics/sales` (`useSalesQuery`, totals in `sales-math.ts`). **Ingresos** and **Tasa de
  reembolsos** have "Ver las compras", which opens `SalesListDialog` (a portal modal closed by its ✕,
  Escape or the backdrop): income lists the purchases not refunded; the rate lists **only the refunded
  ones** with their reason. Every row has "Ver compra", a link to `/admin/purchases?purchase=&type=`
  (`lib/admin-purchase-link.ts`), which opens that purchase's detail.
  Removed: dinero reembolsado, uso de cupos, the "Organizaciones" status panel, the per-org license table, the KPI hint
  texts, and everything crossed out in the sheet (ingresos netos — now just "Ingresos", the same
  number —, cantidad de compras, clientes pagadores, ticket promedio, evolución de ingresos, recompra,
  the "Usuarios finales" panel, solicitudes/aprobados/por producto de reembolsos, cursos más
  contratados, ventas por modalidad, crecimiento de ventas por curso, cursos comprados juntos, tasa de
  reembolso por curso, "Precios y duración de licencias"). If the sales query fails only its widgets
  show the error; the source chart still renders.
  The `/admin/organizations` list has tabs Pendientes/Activas/Rechazadas/Suspendidas/Todas; "Todas"
  excludes suspended (dadas de baja) orgs, and a suspended org's detail panel offers "Reactivar
  organización" (`PATCH status: ACTIVE`). Suspending asks for a mandatory reason (shown in the panel of a suspended org), and rejected/suspended orgs get "Dar de baja" (confirmed inline, `DELETE`), which frees their emails.
  Finally the **per-org license utilization table** `OrgUtilizationTable` — contracted vs. used seats
  (`seatsSold` excludes seats from refunded purchases), ocupación, vence (coloured by `expiryTone`),
  ingresos and an **Estado** badge (Bajo uso / Vence pronto / Saludable / Sin cupos libres); ranked by
  risk, collapses to 6 rows behind a "Ver más (N)" toggle. Exposes `useGrowthMetrics` (shared with Usuarios).
- **Usuarios** (`usage-usuarios.tsx`) — per the users sheet (nov 2026): only the **Usuarios
  activos** and **Nuevos usuarios** series (`DailySeriesChart`, previous window dashed), then the
  **Encuesta inicial** section — who the window's new accounts are, from the app's onboarding survey
  (`GET /admin/metrics/onboarding`, `useOnboardingQuery`): **Edad** (vertical bars by age range,
  short axis ticks "< 18 … 55+", no y axis), **Nivel de conocimiento** and **Motivación**
  (horizontal bars, labels flush with the card's left edge, a fixed 38 px per row so both charts
  have the same bar thickness, each bar on a light full-width track, the counts in their own column
  on the right; motivation is multiple choice) in one row of three (`SurveyBarChart`, labels from
  `survey-answers.ts`). No tooltip or hover. Under each chart, only how many people answered that
  question; the section title has no count. "Sin respuesta" (older app versions, or a skipped
  question) is not drawn — it would dwarf the real answers — but stays in the visually hidden table
  that is the text alternative (wrapped in an `sr-only` div: Firefox paints a table `<caption>`
  outside an `sr-only` table). The section has no divider line above it. Removed: KPIs (activos, nuevos, retención 7 d, sesiones por usuario,
  duración de sesión), the habit & gamification section (`usage-gamification.tsx` deleted) and
  everything else crossed out in the sheet. The survey has its own loading / error states; the two
  series still render if it fails.
- **Aprendizaje** (`usage-learning.tsx`) — "¿La gente aprende LSA?": a course selector, then one KPI card — **Tasa de precisión** (`exercise_success_rate`, period-over-period delta, no hint text); a two-column grid with **Análisis de contenido** (signs only, sortable columns: Seña / Precisión / Reportes — reports joined from `l.reports.mostReportedPending` by sign name) and **Precisión por tipo de ejercicio** (progress bars by block type); and a full-width **Sistema de logros** table (`useGamificationQuery`, merged from `topUnlocked` + `leastUnlocked`, sortable by count asc/desc, with a "Ver todos los logros →" button that opens a modal showing every achievement's unlock rate as a `ProgressBar`). Removed: `lesson_completion_rate` and `global_course_completion` KPI cards; lessons view in "Contenido a revisar" (renamed to "Análisis de contenido", signs only); `courseCompletion` and `abandonmentClass` helpers; `previous` query (no longer needed); `rate1`, `Link`, `courseLessonHref` imports.
- **Infraestructura** (`usage-infra.tsx`) — services strip, then **Backend** directly (no sub-tabs). **Backend** grouped into **API · HTTP** (latency p95/p99, throughput, 4xx/5xx, slowest ops) and **Sistema y recursos** (CPU/mem host + containers, JVM heap/GC — collapsed). The recognition accuracy KPI (camera exercises) is shown in the Backend KPI row. Web / Landing and ML · reconocimiento sub-tabs were removed.

`GoldenTile` (`golden-row.tsx`) is the headline tile that signals a metric's health at a glance, coloured success/warning/danger from the metric's `threshold`; today it is used by the Infraestructura perf tiles (`PerfGoldenTile` in `perf-panel.tsx`), while the other tabs open with `KpiCard`s (v3 layout below). Perf (Prometheus/Grafana)
panels only populate in production; the Infra tab says so, and shows "sin datos" locally.

## v3 layout (mockups, nov 2026)

- **Every KPI has the same anatomy** (`KpiCard`): value, a ▲/▼ delta pill vs. the previous
  equal-length window (`delta.tsx`: `pct`/`pp`/`abs` modes, `good: up|down` colours the change as
  good or bad news, es-AR comma), hint and an optional action (`href` or `onOpen`). **No
  sparklines** (removed from every card, nov 2026: the series live in the charts). Health KPIs pass `toneValue` → dot + coloured
  value from the catalog threshold. Previous windows come from the same endpoints queried with
  `previousRange(range)` (`usage-queries.ts`), no extra API.
- **Período anterior** is drawn dashed on `DailySeriesChart` (`previous` prop) and `PerfChart`
  (`previous` + `previousShiftSeconds`).
- **Tabs** carry health dots (Aprendizaje: completion/success; Infraestructura: services) and the
  "Comparando con … · hora de Argentina" caption on the same row.
- **Resumen** (see the tab bullet above for the current layout): "Requiere atención" (`buildAlerts`): pending orgs, unresolved reports (PENDING + REVIEWED, the same count as the sidebar badge; top sign), low-use
  contracts (→ `/admin/organizations`), worst lesson abandonment ≥ 40 % (deep link
  `/admin/courses?course=&lesson=`, `lib/course-deep-link.ts`), email failures, failed imports.
  `ServicesStrip` (`services-status.tsx`): API/R2 availability (avg of `avg_over_time(up)`),
  email/push failure counts (Σ rate × step), on-device recognition.
- **Usuarios** (superseded nov 2026, see the tab bullet above): retention at 7 days of the window's signups (`retention7`), cohort table removed;
  gamification was one stat strip + XP histogram (XP earned in the window, API tiers 0–100 … 2k+),
  challenge claims, achievements Más/Menos (share of `eligibleUsers`).
- **Funnel** (`funnel.tsx`): `funnelPath` drops a step fewer people reach than a later one (reading-only
  lessons complete without exercises, which used to print "108% sigue"); every transition reads
  "↓ N% sigue" and the biggest drop is red ("· mayor caída").
- **Aprendizaje**: single course picker, "Análisis de contenido" (signs only, sortable: Seña/Precisión/Reportes), "Sistema de logros" full-width below (sortable, all-achievements modal with progress bars).
- **Infraestructura**: Backend KPIs are window averages (peak in hint); 4xx+5xx and p95+p99 share a
  chart; slow ops table with per-endpoint req/s (`endpoint_rate` widget); "Sistema y recursos" collapsed (CPU, mem, containers, JVM heap — 5 panels).
- Designer "Notas de diseño" boxes in the mockups are annotations, not UI.

## Self-documenting widgets

`metric-catalog.ts` is the single source of per-metric copy: `label`, `description` (what it is),
`howComputed` (how the number is worked out, in **plain language — no code, table or column names**, so
anyone can read it), `goodWhen` (what healthy looks like) and an optional `threshold`. Every golden tile (`GoldenTile`), stat (`MetricStat`) and perf chart (`PerfChart`, via its
`metric` prop) carries an `InfoPopover` ("i" button) that reads from this catalog, so the dashboard is
understandable with no prior context. `toneFor(value, threshold)` maps a value to its tone. The popover
renders in a **portal** with fixed positioning (not `absolute` inside the card): the cards keep their own
stacking context from the `dash-card-enter` transform, so an in-card panel would be painted behind later
cards. Status distributions use `BreakdownPie` (`breakdown-pie.tsx`), a donut with a count/share legend; its tooltip is a card like the bar charts' (colour, value, share), offset from the cursor and click-through, and hovering a slice fades the others (slices and legend rows).

## Interactive time filter (brush → global range)

Dragging across any `PerfChart` line chart draws a `ReferenceArea` and, on release, calls `onSelectRange`
with the selected `[from, to]` seconds; clicking a day bar in `DailyActivityChart` selects that whole day.
The page turns that into a `{ kind: "custom", from, to }` `RangeSelection`, which re-runs **every** widget
(their query keys include `from/to`). No extra plumbing: the shared filter already propagates. A tiny
selection is widened to a minimum span (`MIN_SPAN_SECONDS`, 5 min) so focusing on a spike never reads as
"sin datos" (Prometheus scrapes every 60 s). The window comes from `selectionWindow` (`src/lib/datetime-range.ts`): the end is cut at now **without
moving the start**, so clicking the bucket in progress (10:00–11:00 at 10:31) opens 10:00–10:31 — the
people that bar counted — and not 9:31–10:31; only a window under the minimum span is widened (and kept
before now). Each time-series widget has its **own line/bar toggle**
(`ChartKindToggle` in `chart-kind.tsx`, a local `useState` per chart, in the card header) — there is no
page-level toggle. `DailySeriesChart` takes the active `range` and lays out **every** bucket of the period
on the x axis (gaps filled with 0, or "sin datos"/null for rates via `emptyAsNull`), at a resolution that
follows the window (minute/hour/day, or forced day via `dayResolution` for the day-only Learning/
Gamification series); the y axis is labelled with values. Its x axis is keyed by each bucket's **instant** (`epoch`),
not its label: in a 24 h window "10:00" is two buckets (yesterday and today), and a repeated category made
the tooltip show the other day's value. Lines are **steps** (`stepAfter`): a bucket's count holds over the
whole bucket, so the line rises at 10:00 when someone came in at 10:xx instead of sloping up from 9:00.
The tooltip names the whole bucket (`bucketLabel`: "22 nov, 10:00 – 11:00", or the day) — an hour's
active count is distinct people in that hour, so zooming into it shows per-minute counts that are lower.

## Data sources (two, one picker)

- **Business** → `metricsApi.business({ from, to })` → signa-api `GET /admin/metrics/business`, aggregated
  from Postgres. Shared via `useBusinessMetrics` (`usage-business.tsx`); consumed by the Negocio and
  Aprendizaje tabs (one cached fetch per range).
- **Sales** → `metricsApi.sales({ from, to })` → signa-api `GET /admin/metrics/sales`: every purchase
  paid in the window (refunded ones flagged with a reason: a buyer reason, `CHARGEBACK` or
  `UNSPECIFIED`), refund reasons, popular courses, income per course and gem sources. Powers the
  Negocio money cards, their purchase lists and the course/reason/gem widgets.
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
  rates by type, gifts and the shop economy. No longer shown (the Usuarios gamification section was removed, nov 2026); `metricsApi.gamification` stays in the client.
- **Onboarding survey** → `metricsApi.onboarding({ from, to })` → signa-api `GET /admin/metrics/onboarding`: the
  window's signups (no SIGNA staff) and their survey answers by age range, experience level and
  motivation, each option in order plus `NO_ANSWER`. Powers the Usuarios "Encuesta inicial" section.
- **Performance / infra** → `metricsApi.perf(widget, { from, to, step })` → signa-api
  `GET /admin/metrics/perf/{widget}`, which proxies PromQL `query_range` to Grafana Cloud. Rendered by
  `PerfChart` via `PerfPanel`/`PerfGoldenTile` (`perf-panel.tsx`); value formatters in `perf-format.ts`.

The picker emits a `RangeSelection` (`datetime-range.ts`); the page resolves it to ISO instants and a
suggested `step` (`deriveStepSeconds`). While **live**, rolling presets re-anchor to "now" every 30 s and
all TanStack queries (`refetchInterval`) refresh. Query keys: `["admin","metrics",<kind>,…,from,to,step]`.

## Notes & limits

- **Money net of refunds:** the API keeps gross fields (`paidAmount`, `purchases`, `daily`) and adds
  `netAmount` + `netCount`/`netPurchases` + `dailyNet` (purchases that were **not** refunded, attributed to
  the period they were paid in). **Every** money figure uses that rule, so they add up across the page:
  Ingresos = the sum of the net fields = the bars of "Ingresos por fuente" = the Negocio card (from
  `sales`, same rule); Tasa de reembolsos is **by count** (refunded ÷ all purchases of the window). Subtracting
  the refunds _made_ in the window (an older purchase refunded now) mixed periods and broke the
  period-over-period delta. `fmtMoneyCompact` keeps one decimal under $100 k so tiles and legend add up.

- **Universe:** every Usuarios metric (new, total, activation, active, sessions) counts accounts that are not
  `Role.ADMIN` (SIGNA staff). The "% de usuarios totales" under active users uses the same growth `users.total`.
  XP is stored per Argentine day, so the API counts the days whose midnight falls in the window (7 days → 7
  days, 24 h → today), end-exclusive, and the previous window shares no day with the current; otherwise a
  24 h window summed two days of XP against one day of active users ("XP por usuario activo" doubled).
- **Active user:** a distinct learner (`Role.USER`) with _any_ authenticated activity in the app in the
  window (exercises, friends, shop, boosters, …), not just exercise attempts. `signa-api` records a
  throttled `user_activity` row (≤1/min/user) from `JwtAuthFilter`; counts are `COUNT(DISTINCT user)`, so
  20 connections in an hour = 1 active user. Backfilled from attempts and sessions.
- **Sessions:** `signa-mobile` re-sends the running session every 30 s (same `sessionId`, server upserts
  and keeps the max duration), so sessions appear without having to background the app.

- **Resolution:** the **Growth** series (`SeriesCount`/`SeriesAmount` with a `t` instant) are
  **adaptive**: signa-api buckets them from **Argentine midnight** (`MetricsRange.BUCKET_ORIGIN_SECONDS`,
  03:00 UTC) with `bucket = MetricsRange.bucketSeconds()` (minute if the span ≤ 6 h, hour if ≤ 3 d, else
  day), so a 30-minute window reads minute-by-minute and a 30-day window day-by-day, and a day bucket is an
  Argentine calendar day. `DailySeriesChart` and `RevenueBySourceChart` lay their axis on the same
  boundaries (`argentinaBucketStart` in `lib/timezone.ts`) and format in Argentina time. Bucketing or
  formatting at UTC midnight showed each day under the previous date (UTC midnight is 21:00 the day
  before), so a 7-day chart ended "yesterday". Learning/Gamification series stay **day** resolution
  (`DailyCount` with a `day`, an Argentine day; parse it with `seriesPointMs`, never `new Date(day)`,
  which reads it as UTC midnight).
- **Grafana token:** performance panels need a Grafana Cloud `metrics:read` token on the server
  (`GRAFANA_CLOUD_PROM_*`). Without it the backend returns `available:false` and panels show "sin datos";
  the business tabs keep working.
- Colors come from tokens only (`perf-chart.tsx` palette); every chart has a text-alternative summary and
  handles loading / empty / error / unavailable.
