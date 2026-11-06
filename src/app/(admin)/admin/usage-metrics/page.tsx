"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartKindContext, type ChartKind } from "@/components/dashboard/chart-kind";
import { DatetimeRangePicker } from "@/components/dashboard/datetime-range-picker";
import { MetricsTabs, type TabItem } from "@/components/dashboard/metrics-tabs";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { PageHeading } from "@/components/dashboard/ui";
import { GrowthTab } from "@/components/dashboard/usage-growth";
import { InfraTab } from "@/components/dashboard/usage-infra";
import { LearningTab } from "@/components/dashboard/usage-learning";
import { UsersTab } from "@/components/dashboard/usage-usuarios";
import {
  DEFAULT_SELECTION,
  deriveStepSeconds,
  resolveRange,
  type RangeSelection,
} from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

type TabKey = "negocio" | "usuarios" | "aprendizaje" | "infraestructura";

const TABS: TabItem<TabKey>[] = [
  { key: "negocio", label: "Negocio" },
  { key: "usuarios", label: "Usuarios" },
  { key: "aprendizaje", label: "Aprendizaje" },
  { key: "infraestructura", label: "Infraestructura" },
];

/** Below this, a brushed window has too few Prometheus points (60 s scrape) and reads as empty. */
const MIN_SPAN_SECONDS = 300;

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((t) => t.key === value);
}

export default function UsageMetricsPage() {
  const [selection, setSelection] = useState<RangeSelection>(DEFAULT_SELECTION);
  const [live, setLive] = useState(true);
  const [now, setNow] = useState(() => new Date());
  // Seed the apartado from the URL (bookmarkable) without useSearchParams. Safe as a lazy initializer:
  // the admin page only mounts client-side, after the auth gate in the layout resolves.
  const [tab, setTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "negocio";
    const t = new URLSearchParams(window.location.search).get("tab");
    return isTabKey(t) ? t : "negocio";
  });
  const [chartKind, setChartKind] = useState<ChartKind>("line");

  const changeTab = (next: TabKey) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  };

  // Re-anchor rolling presets while "live": the window (and the query keys) move with wall-clock.
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => clearInterval(id);
  }, [live]);

  const changeSelection = (next: RangeSelection) => {
    setSelection(next);
    setNow(new Date());
  };

  const range = useMemo(() => resolveRange(selection, now), [selection, now]);
  const step = useMemo(() => deriveStepSeconds(range), [range]);

  // A time window picked by dragging a chart (or clicking a day bar) becomes the global filter.
  // Tiny selections are widened to a minimum span so focusing on a spike never reads as "sin datos".
  const onSelectRange: RangeSelect = (fromSeconds, toSeconds) => {
    let from = Math.min(fromSeconds, toSeconds);
    let to = Math.max(fromSeconds, toSeconds);
    if (to - from < MIN_SPAN_SECONDS) {
      const mid = (from + to) / 2;
      from = Math.round(mid - MIN_SPAN_SECONDS / 2);
      to = Math.round(mid + MIN_SPAN_SECONDS / 2);
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (to > nowSec) {
      from -= to - nowSec;
      to = nowSec;
    }
    changeSelection({
      kind: "custom",
      from: new Date(from * 1000).toISOString(),
      to: new Date(to * 1000).toISOString(),
    });
  };

  const perf = { range, step, live };

  return (
    <section className="flex flex-col gap-6">
      <PageHeading
        title="Métricas de uso"
        subtitle="Uso general de toda la app (con y sin organización), organizado por área. Arrastrá sobre un gráfico para filtrar por esa franja horaria."
      >
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <div className="border-border flex h-9 items-center rounded-full border p-0.5 text-[13px] font-extrabold">
            {(["line", "bar"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setChartKind(k)}
                aria-pressed={chartKind === k}
                className={cn(
                  "h-8 cursor-pointer rounded-full px-3 transition-colors",
                  chartKind === k ? "bg-primary-light text-primary-dark" : "text-text-muted",
                )}
              >
                {k === "line" ? "Línea" : "Barras"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            aria-pressed={live}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-extrabold transition-colors",
              live ? "bg-success-light text-success-dark" : "border-border text-text-muted border",
            )}
          >
            <span className={cn("size-2 rounded-full", live ? "bg-success" : "bg-text-muted")} />
            {live ? "En vivo" : "Pausado"}
          </button>
          <DatetimeRangePicker value={selection} onChange={changeSelection} />
        </div>
      </PageHeading>

      <MetricsTabs tabs={TABS} active={tab} onChange={changeTab} idBase="metrics" />

      <ChartKindContext.Provider value={chartKind}>
        <div role="tabpanel" id={`metrics-panel-${tab}`} aria-labelledby={`metrics-tab-${tab}`}>
          {tab === "negocio" ? (
            <GrowthTab range={range} live={live} onSelectRange={onSelectRange} />
          ) : null}
          {tab === "usuarios" ? (
            <UsersTab range={range} live={live} onSelectRange={onSelectRange} />
          ) : null}
          {tab === "aprendizaje" ? (
            <LearningTab range={range} live={live} onSelectRange={onSelectRange} />
          ) : null}
          {tab === "infraestructura" ? <InfraTab {...perf} onSelectRange={onSelectRange} /> : null}
        </div>
      </ChartKindContext.Provider>
    </section>
  );
}
