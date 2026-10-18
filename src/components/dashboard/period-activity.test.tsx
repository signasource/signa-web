import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PeriodActivity } from "@/components/dashboard/period-activity";
import type { ActivityFigures, OrganizationActivity } from "@/lib/api/types";

const RANGE = { from: "2026-10-01", to: "2026-10-02" };

function figures(exerciseAttempts: number, correctAnswers: number, lessons = 0): ActivityFigures {
  return {
    activeParticipants: exerciseAttempts ? 2 : 0,
    exerciseAttempts,
    correctAnswers,
    correctPercentage: exerciseAttempts ? Math.round((correctAnswers / exerciseAttempts) * 100) : 0,
    lessonsCompleted: lessons,
    learningMinutes: 0,
  };
}

const ACTIVITY: OrganizationActivity = {
  ...RANGE,
  totals: figures(20, 15, 3),
  days: [
    { date: "2026-10-01", figures: figures(12, 9, 1) },
    { date: "2026-10-02", figures: figures(8, 6, 2) },
  ],
};

function renderCard(data: OrganizationActivity | undefined, state = {}) {
  return render(
    <PeriodActivity
      range={RANGE}
      picker={<span>picker</span>}
      data={data}
      isPending={false}
      isError={false}
      {...state}
    />,
  );
}

describe("PeriodActivity", () => {
  afterEach(cleanup);

  it("shows the period, its totals and a text summary of the chart", () => {
    renderCard(ACTIVITY);
    expect(screen.getByText("1 – 2 oct 2026")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "1 oct: 12. 2 oct: 8");
  });

  it("switches metric and shows the table fallback", () => {
    renderCard(ACTIVITY);
    fireEvent.click(screen.getByRole("button", { name: "Lecciones" }));
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "1 oct: 1. 2 oct: 2");
    fireEvent.click(screen.getByRole("button", { name: "Ver tabla" }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "DÍA" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("explains an empty period instead of drawing an empty chart", () => {
    renderCard({
      ...ACTIVITY,
      totals: figures(0, 0),
      days: ACTIVITY.days.map((d) => ({ ...d, figures: figures(0, 0) })),
    });
    expect(screen.getByText(/No hubo actividad en este período/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("covers loading and error states", () => {
    renderCard(undefined, { isPending: true });
    expect(screen.getByText("Cargando actividad…")).toBeInTheDocument();
    cleanup();
    renderCard(undefined, { isError: true });
    expect(screen.getByText("No pudimos cargar la actividad.")).toBeInTheDocument();
  });
});
