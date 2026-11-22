"use client";

import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
import { surveyBars } from "@/components/dashboard/survey-answers";
import { SurveyBarChart } from "@/components/dashboard/survey-bar-chart";
import { Card, ErrorState, LoadingState } from "@/components/dashboard/ui";
import { useGrowthQuery, useOnboardingQuery } from "@/components/dashboard/usage-queries";
import { previousRange, type DateTimeRange } from "@/lib/datetime-range";

/**
 * Usuarios — who arrives and who stays: the new and active users series (new on the left) (with the previous
 * window dashed), then who the window's new accounts are, from the app's onboarding survey: age
 * range, how much LSA they knew and why they want to learn.
 */
export function UsersTab({
  range,
  live,
  onSelectRange,
}: {
  range: DateTimeRange;
  live: boolean;
  onSelectRange: RangeSelect;
}) {
  const growth = useGrowthQuery(range, live);
  const previous = useGrowthQuery(previousRange(range), live);

  if (growth.isPending) return <LoadingState>Cargando métricas de usuarios…</LoadingState>;
  if (!growth.data) return <ErrorState>No pudimos cargar las métricas de usuarios.</ErrorState>;

  const g = growth.data;
  const pg = previous.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <DailySeriesChart
          title="Nuevos usuarios"
          metric="new_users"
          seriesLabel="Nuevos"
          points={g.users.daily.map((d) => ({ t: d.t, value: d.count }))}
          previous={pg?.users.daily.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
        />
        <DailySeriesChart
          title="Usuarios activos"
          metric="users_active"
          seriesLabel="Activos"
          points={g.engagement.dailyActive.map((d) => ({ t: d.t, value: d.count }))}
          previous={pg?.engagement.dailyActive.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
        />
      </div>

      <SurveySection range={range} live={live} />
    </div>
  );
}

/** Who the window's new accounts are, from the onboarding survey (its own query and states). */
function SurveySection({ range, live }: { range: DateTimeRange; live: boolean }) {
  const query = useOnboardingQuery(range, live);
  const heading = (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="font-display text-xl font-bold tracking-tight">Encuesta inicial</h2>
    </div>
  );

  if (query.isPending) {
    return (
      <>
        {heading}
        <Card>
          <LoadingState>Cargando la encuesta…</LoadingState>
        </Card>
      </>
    );
  }
  if (!query.data) {
    return (
      <>
        {heading}
        <Card>
          <ErrorState>No pudimos cargar la encuesta inicial.</ErrorState>
        </Card>
      </>
    );
  }

  const o = query.data;
  return (
    <>
      {heading}
      <div className="grid items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <SurveyBarChart
          title="Edad"
          metric="survey_age"
          orientation="columns"
          base={o.signups}
          items={surveyBars(o.ageRanges)}
        />
        <SurveyBarChart
          title="Nivel de conocimiento"
          metric="survey_level"
          orientation="rows"
          base={o.signups}
          items={surveyBars(o.experienceLevels)}
        />
        <SurveyBarChart
          title="Motivación"
          metric="survey_motivation"
          orientation="rows"
          base={o.signups}
          items={surveyBars(o.motivations)}
        />
      </div>
    </>
  );
}
