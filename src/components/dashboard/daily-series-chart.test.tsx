import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { fmtCount } from "@/components/dashboard/perf-format";

describe("DailySeriesChart", () => {
  afterEach(cleanup);

  it("renders a text summary of the bars and the info popover", () => {
    render(
      <DailySeriesChart
        title="Nuevos usuarios"
        metric="new_users"
        points={[
          { t: "2026-11-01", value: 12 },
          { t: "2026-11-02", value: 8 },
        ]}
        format={fmtCount}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "1 nov: 12. 2 nov: 8");
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
        range={{ from: "2026-11-03T00:00:00.000Z", to: "2026-11-05T00:00:00.000Z" }}
        dayResolution
        points={[
          { t: "2026-11-03", value: 10 },
          { t: "2026-11-04", value: 20 },
        ]}
        previous={[
          { t: "2026-11-01", value: 7 },
          { t: "2026-11-02", value: 9 },
        ]}
        format={fmtCount}
      />,
    );
    expect(screen.getByText("Activos")).toBeInTheDocument();
    expect(screen.getByText("Período anterior")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "3 nov: 10. 4 nov: 20");
    expect(container.querySelectorAll('[role="group"]').length).toBe(1);
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
