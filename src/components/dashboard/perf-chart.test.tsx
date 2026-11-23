import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PerfChart, alignPrevious } from "@/components/dashboard/perf-chart";
import type { PerfMetrics } from "@/lib/api/metrics";

describe("alignPrevious", () => {
  // This window: 1000, 1030, 1060 (30 s step); the previous one is 3600 s earlier.
  const rows = [{ t: 1000 }, { t: 1030 }, { t: 1060 }];

  it("overlays the previous window when its timestamps line up exactly", () => {
    const prev = [
      { t: -2600, v: 1 },
      { t: -2570, v: 2 },
      { t: -2540, v: 3 },
    ];
    expect(alignPrevious(rows, prev, 3600)).toEqual([1, 2, 3]);
  });

  it("still overlays it when the two queries' grids drift a few seconds", () => {
    // Shifted by 7 s (another grid alignment, or "En vivo" moved the window between queries):
    // an exact match would drop every point.
    const prev = [
      { t: -2593, v: 1 },
      { t: -2563, v: 2 },
      { t: -2533, v: 3 },
    ];
    expect(alignPrevious(rows, prev, 3600)).toEqual([1, 2, 3]);
  });

  it("leaves a row empty when no previous point falls within half a step", () => {
    expect(alignPrevious(rows, [{ t: -2570, v: 5 }], 3600)).toEqual([null, 5, null]);
    expect(alignPrevious(rows, [{ t: -2400, v: 5 }], 3600)).toEqual([null, null, null]);
  });

  it("keeps the closest point when two land on the same row", () => {
    const prev = [
      { t: -2575, v: 7 },
      { t: -2571, v: 8 },
    ];
    expect(alignPrevious(rows, prev, 3600)).toEqual([null, 8, null]);
  });

  it("returns empty rows when there is nothing to align", () => {
    expect(alignPrevious(rows, [], 3600)).toEqual([null, null, null]);
    expect(alignPrevious([], [{ t: 1, v: 1 }], 3600)).toEqual([]);
  });
});

const series = (points: { t: number; v: number | null }[]): PerfMetrics => ({
  widget: "throughput",
  available: true,
  series: [{ labels: {}, points }],
});

describe("PerfChart previous window legend", () => {
  afterEach(cleanup);
  const current = series([
    { t: 1000, v: 1 },
    { t: 1030, v: 2 },
  ]);

  it("names the previous window when it has data", () => {
    render(
      <PerfChart
        title="Consultas por minuto"
        data={current}
        isPending={false}
        isError={false}
        previous={series([
          { t: -2600, v: 1 },
          { t: -2570, v: 1 },
        ])}
        previousShiftSeconds={3600}
      />,
    );
    expect(screen.getByText("Período anterior")).toBeInTheDocument();
  });

  it("says when the previous window came back without data", () => {
    render(
      <PerfChart
        title="Consultas por minuto"
        data={current}
        isPending={false}
        isError={false}
        previous={series([])}
        previousShiftSeconds={3600}
      />,
    );
    expect(screen.getByText("Período anterior: sin datos")).toBeInTheDocument();
  });
});
