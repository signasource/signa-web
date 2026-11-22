import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DailySeriesChart,
  bucketLabel,
  buildSeries,
} from "@/components/dashboard/daily-series-chart";
import { fmtCount } from "@/components/dashboard/perf-format";

describe("DailySeriesChart", () => {
  afterEach(cleanup);

  it("renders a text summary of the bars and the info popover", () => {
    render(
      <DailySeriesChart
        title="Nuevos usuarios"
        metric="new_users"
        points={[
          { t: "2026-11-02T03:00:00Z", value: 12 },
          { t: "2026-11-03T03:00:00Z", value: 8 },
        ]}
        format={fmtCount}
      />,
    );
    // Using UTC dates (03:00 UTC = 00:00 Argentina) for deterministic formatting
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "2 nov: 12. 3 nov: 8");
    expect(screen.getByRole("button", { name: /Qué es/ })).toBeInTheDocument();
  });

  it("explains an empty period instead of drawing an empty chart", () => {
    render(<DailySeriesChart title="Nuevos usuarios" metric="new_users" points={[]} />);
    expect(screen.getByText("Sin datos en este período.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("drops points with an unparseable timestamp instead of crashing the page", () => {
    render(
      <DailySeriesChart
        title="Nuevos usuarios"
        metric="new_users"
        points={[{ t: undefined as unknown as string, value: 5 }]}
      />,
    );
    expect(screen.getByText("Sin datos en este período.")).toBeInTheDocument();
  });

  it("overlays the previous window shifted onto this one, with a legend", () => {
    const { container } = render(
      <DailySeriesChart
        title="Usuarios activos"
        metric="users_active"
        seriesLabel="Activos"
        range={{ from: "2026-11-03T03:00:00.000Z", to: "2026-11-05T03:00:00.000Z" }}
        dayResolution
        points={[
          { t: "2026-11-03T03:00:00Z", value: 10 },
          { t: "2026-11-04T03:00:00Z", value: 20 },
        ]}
        previous={[
          { t: "2026-11-01T03:00:00Z", value: 7 },
          { t: "2026-11-02T03:00:00Z", value: 9 },
        ]}
        format={fmtCount}
      />,
    );
    expect(screen.getByText("Activos")).toBeInTheDocument();
    expect(screen.getByText("Período anterior")).toBeInTheDocument();
    // Buckets start at Argentine midnight (03:00 UTC), like the API's: the point at
    // 2026-11-03T03:00Z is the 3rd, not the 2nd. The window ends (exclusive) at the 5th's midnight.
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "3 nov: 10. 4 nov: 20");
    expect(container.querySelectorAll('[role="group"]').length).toBe(1);
  });

  it("lays a rolling window on Argentine days, today last", () => {
    // "Últimos 3 días" at 16:30 on Nov 20 (Argentina): the days are the 17th to the 20th.
    render(
      <DailySeriesChart
        title="Usuarios activos"
        metric="users_active"
        range={{ from: "2026-11-17T19:30:00.000Z", to: "2026-11-20T19:30:00.000Z" }}
        dayResolution
        points={[
          { t: "2026-11-19T03:00:00Z", value: 4 },
          { t: "2026-11-20T03:00:00Z", value: 6 },
        ]}
        format={fmtCount}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "17 nov: 0. 18 nov: 0. 19 nov: 4. 20 nov: 6",
    );
  });

  it("reads a bare YYYY-MM-DD as that Argentine day, not the previous evening", () => {
    render(
      <DailySeriesChart
        title="Señas aprendidas"
        metric="new_users"
        points={[
          { t: "2026-11-19", value: 3 },
          { t: "2026-11-20", value: 5 },
        ]}
        format={fmtCount}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "19 nov: 3. 20 nov: 5");
  });

  it("can hide the line/bar switch", () => {
    const { container } = render(
      <DailySeriesChart
        title="Lecciones"
        metric="lessons_completed"
        showKindToggle={false}
        points={[{ t: "2026-11-01", value: 1 }]}
      />,
    );
    expect(container.querySelector('[role="group"]')).toBeNull();
  });
});

describe("bucketLabel", () => {
  it("names the whole bucket below a day, and only the day otherwise", () => {
    const tenArt = Date.parse("2026-11-22T13:00:00Z");
    expect(bucketLabel(tenArt, 3600)).toMatch(/22 nov.*10:00.*–.*11:00/);
    expect(bucketLabel(tenArt, 86400)).toBe("22 nov");
  });
});

describe("buildSeries — previous window", () => {
  // Last 4 hours: minute buckets.
  const range = { from: "2026-11-22T13:00:00.000Z", to: "2026-11-22T17:00:00.000Z" };

  it("draws an empty previous window as 0, not as 'sin datos'", () => {
    const { data, withPrevious, bucketSeconds } = buildSeries({
      points: [{ t: "2026-11-22T16:30:00Z", value: 2 }],
      previous: [],
      range,
    });
    expect(bucketSeconds).toBe(60);
    expect(withPrevious).toBe(true);
    expect(data).toHaveLength(240);
    expect(data.every((d) => d.prev === 0)).toBe(true);
  });

  it("lines the previous 4 hours up minute by minute", () => {
    const { data } = buildSeries({
      points: [],
      // 12:15 UTC in the previous window → 16:15 UTC in this one.
      previous: [{ t: "2026-11-22T12:15:00Z", value: 3 }],
      range,
    });
    const at = data.find((d) => d.epoch === Date.parse("2026-11-22T16:15:00Z"));
    expect(at?.prev).toBe(3);
    expect(data.filter((d) => d.prev === 3)).toHaveLength(1);
  });

  it("keeps rates without a previous value as null", () => {
    const { data } = buildSeries({ points: [], previous: [], range, emptyAsNull: true });
    expect(data.every((d) => d.prev === null)).toBe(true);
  });

  it("does not draw a previous window while it has not been fetched", () => {
    const { data, withPrevious } = buildSeries({ points: [], range });
    expect(withPrevious).toBe(false);
    expect(data.every((d) => d.prev === undefined)).toBe(true);
  });
});
