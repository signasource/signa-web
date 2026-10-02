import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WeeklyEvolution } from "@/components/dashboard/weekly-evolution";

const WEEKS = [
  { weekStart: "2026-09-21", exerciseAttempts: 15, correctPercentage: 83 },
  { weekStart: "2026-09-28", exerciseAttempts: 18, correctPercentage: 84 },
];

describe("WeeklyEvolution", () => {
  afterEach(cleanup);

  it("exposes a text summary of the chart", () => {
    render(<WeeklyEvolution weeks={WEEKS} />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Semana del 21 sep: 15. Semana del 28 sep: 18",
    );
  });

  it("switches metric and shows the table fallback", () => {
    render(<WeeklyEvolution weeks={WEEKS} />);
    fireEvent.click(screen.getByRole("button", { name: "Respuestas correctas" }));
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Semana del 21 sep: 83%. Semana del 28 sep: 84%",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver tabla" }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Semana del 28 sep")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
