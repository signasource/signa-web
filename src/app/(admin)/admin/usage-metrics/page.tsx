"use client";

import { useEffect, useMemo, useState } from "react";
import { DatetimeRangePicker } from "@/components/dashboard/datetime-range-picker";
import { MetricsTabs, type TabItem } from "@/components/dashboard/metrics-tabs";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { PageHeading } from "@/components/dashboard/ui";
import { GrowthTab } from "@/components/dashboard/usage-growth";
import { InfraTab } from "@/components/dashboard/usage-infra";
import { LearningTab } from "@/components/dashboard/usage-learning";
import { ResumenTab, type ResumenTarget } from "@/components/dashboard/usage-resumen";
import { UsersTab } from "@/components/dashboard/usage-usuarios";
import {
  DEFAULT_SELECTION,
  deriveStepSeconds,
  resolveRange,
  type RangeSelection,
} from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

type TabKey = "resumen" | "negocio" | "usuarios" | "aprendizaje" | "infraestructura";

const TABS: TabItem<TabKey>[] = [
  { key: "resumen", label: "Resumen" },
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

const WINDOW_DATE = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "10 sep – 9 oct": the equal-length window immediately before the selected one, in UTC. */
function previousWindowLabel(range: { from: string; to: string }): string {
  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return "el período anterior";
  const prevFrom = new Date(from - (to - from));
  const prevTo = new Date(from - 1);
  return `${WINDOW_DATE.format(prevFrom)} – ${WINDOW_DATE.format(prevTo)}`;
}

export default function UsageMetricsPage() {
  const [selection, setSelection] = useState<RangeSelection>(DEFAULT_SELECTION);
  const [live, setLive] = useState(true);
  const [now, setNow] = useState(() => new Date());
  // Seed the apartado from the URL (bookmarkable) without useSearchParams. Safe as a lazy initializer:
  // the admin page only mounts client-side, after the auth gate in the layout resolves.
  const [tab, setTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "resumen";
    const t = new URLSearchParams(window.location.search).get("tab");
    return isTabKey(t) ? t : "resumen";
  });
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
      <PageHeading title="Métricas de uso">
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
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

      <div className="flex flex-col gap-1">
        <MetricsTabs tabs={TABS} active={tab} onChange={changeTab} idBase="metrics" />
        <p className="text-text-muted text-right text-xs">
          Comparando con {previousWindowLabel(range)} · horario UTC
        </p>
      </div>

      <div role="tabpanel" id={`metrics-panel-${tab}`} aria-labelledby={`metrics-tab-${tab}`}>
        {tab === "resumen" ? (
          <ResumenTab
            range={range}
            live={live}
            step={step}
            onSelectRange={onSelectRange}
            onSelectTab={(t: ResumenTarget) => changeTab(t)}
          />
        ) : null}
        {tab === "negocio" ? (
          <GrowthTab range={range} live={live} onSelectRange={onSelectRange} />
        ) : null}
        {tab === "usuarios" ? (
          <UsersTab range={range} live={live} onSelectRange={onSelectRange} />
        ) : null}
        {tab === "aprendizaje" ? (
          <LearningTab range={range} live={live} step={step} onSelectRange={onSelectRange} />
        ) : null}
        {tab === "infraestructura" ? <InfraTab {...perf} onSelectRange={onSelectRange} /> : null}
      </div>
    </section>
  );
}
