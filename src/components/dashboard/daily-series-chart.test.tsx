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
});
