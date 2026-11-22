import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UsersTab } from "@/components/dashboard/usage-usuarios";
import type { GrowthMetrics, OnboardingMetrics } from "@/lib/api/metrics";

type QueryState<T> = { isPending: boolean; data: T | undefined };

const queries = vi.hoisted(() => ({
  growth: { isPending: false, data: undefined } as QueryState<unknown>,
  onboarding: { isPending: false, data: undefined } as QueryState<unknown>,
}));

vi.mock("@/components/dashboard/usage-queries", () => ({
  useGrowthQuery: () => queries.growth,
  useOnboardingQuery: () => queries.onboarding,
}));
// Recharts needs a real layout; these stubs keep the titles, which is what the tab arranges.
vi.mock("@/components/dashboard/daily-series-chart", () => ({
  DailySeriesChart: ({ title }: { title: string }) => <div>{title}</div>,
}));

const RANGE = { from: "2026-11-14T00:00:00.000Z", to: "2026-11-21T00:00:00.000Z" };

const GROWTH = {
  users: { daily: [] },
  engagement: { dailyActive: [] },
} as unknown as GrowthMetrics;

const ONBOARDING: OnboardingMetrics = {
  signups: 10,
  ageRanges: [
    { key: "UNDER_18", count: 1 },
    { key: "FROM_18_TO_24", count: 5 },
    { key: "FROM_25_TO_34", count: 2 },
    { key: "FROM_35_TO_44", count: 0 },
    { key: "FROM_45_TO_54", count: 0 },
    { key: "FROM_55", count: 0 },
    { key: "NO_ANSWER", count: 2 },
  ],
  experienceLevels: [
    { key: "NOVICE", count: 6 },
    { key: "SOME", count: 3 },
    { key: "FLUENT", count: 0 },
    { key: "NO_ANSWER", count: 1 },
  ],
  motivations: [
    { key: "FAMILY", count: 4 },
    { key: "WORK", count: 5 },
    { key: "CURIOSITY", count: 2 },
    { key: "INCLUSION", count: 1 },
    { key: "NO_ANSWER", count: 1 },
  ],
};

function renderTab() {
  return render(<UsersTab range={RANGE} live={false} onSelectRange={() => {}} />);
}

describe("UsersTab", () => {
  beforeEach(() => {
    queries.growth = { isPending: false, data: GROWTH };
    queries.onboarding = { isPending: false, data: ONBOARDING };
  });
  afterEach(cleanup);

  it("shows new users on the left and active users on the right, then the onboarding survey", () => {
    renderTab();
    const titles = ["Nuevos usuarios", "Usuarios activos", "Encuesta inicial", "Edad"].map(
      (t) => screen.getAllByText(t, { exact: true })[0]!,
    );
    for (let i = 1; i < titles.length; i++) {
      expect(
        titles[i - 1]!.compareDocumentPosition(titles[i]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    for (const gone of [
      "Hábito y gamificación",
      "Retención a 7 días",
      "Sesiones por usuario",
      "Duración de sesión",
    ]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument();
    }
  });

  it("charts age, level and motivation of the window's signups, with a text alternative", () => {
    renderTab();
    // No count beside the section title; each chart shows its own.
    expect(screen.queryByText("10 respuestas")).not.toBeInTheDocument();
    // Under each chart, only how many answered that question; "Sin respuesta" is not shown.
    const ageCard = screen.getAllByText("Edad")[0]!.closest("div.rounded-2xl")!;
    expect(ageCard).toHaveTextContent("8 respuestas");
    expect(screen.getAllByText("9 respuestas")).toHaveLength(2);
    expect(screen.queryByText(/Sin respuesta:/)).not.toBeInTheDocument();
    const age = screen.getByRole("table", { name: "Edad" });
    expect(within(age).getByRole("row", { name: "18 a 24 5 50%" })).toBeInTheDocument();
    expect(within(age).getByRole("row", { name: "Sin respuesta 2 20%" })).toBeInTheDocument();
    const level = screen.getByRole("table", { name: "Nivel de conocimiento" });
    expect(within(level).getByRole("row", { name: "Nunca lo vi 6 60%" })).toBeInTheDocument();
    const motivation = screen.getByRole("table", { name: "Motivación" });
    expect(
      within(motivation).getByRole("row", { name: "Trabajo o estudio 5 50%" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Podían elegir más de una.")).not.toBeInTheDocument();
  });

  it("says when nobody answered one question, and agrees in number", () => {
    queries.onboarding = {
      isPending: false,
      data: {
        ...ONBOARDING,
        signups: 1,
        motivations: [
          { key: "FAMILY", count: 1 },
          { key: "WORK", count: 0 },
          { key: "CURIOSITY", count: 0 },
          { key: "INCLUSION", count: 0 },
          { key: "NO_ANSWER", count: 0 },
        ],
        experienceLevels: [
          { key: "NOVICE", count: 0 },
          { key: "SOME", count: 0 },
          { key: "FLUENT", count: 0 },
          { key: "NO_ANSWER", count: 1 },
        ],
      },
    };
    renderTab();
    expect(screen.getByText("1 respuesta")).toBeInTheDocument();
    expect(screen.getByText("Nadie respondió esta pregunta en este período.")).toBeInTheDocument();
  });

  it("says when nobody signed up in the window", () => {
    queries.onboarding = {
      isPending: false,
      data: {
        ...ONBOARDING,
        signups: 0,
        ageRanges: ONBOARDING.ageRanges.map((a) => ({ ...a, count: 0 })),
      },
    };
    renderTab();
    expect(screen.getAllByText("Sin registros en este período.").length).toBe(3);
  });

  it("shows the survey's loading and error states without hiding the charts", () => {
    queries.onboarding = { isPending: true, data: undefined };
    const { unmount } = renderTab();
    expect(screen.getByText("Cargando la encuesta…")).toBeInTheDocument();
    expect(screen.getByText("Usuarios activos")).toBeInTheDocument();
    unmount();
    queries.onboarding = { isPending: false, data: undefined };
    renderTab();
    expect(screen.getByText("No pudimos cargar la encuesta inicial.")).toBeInTheDocument();
  });

  it("shows the tab's own loading and error states", () => {
    queries.growth = { isPending: true, data: undefined };
    const { unmount } = renderTab();
    expect(screen.getByText("Cargando métricas de usuarios…")).toBeInTheDocument();
    unmount();
    queries.growth = { isPending: false, data: undefined };
    renderTab();
    expect(screen.getByText("No pudimos cargar las métricas de usuarios.")).toBeInTheDocument();
  });
});
