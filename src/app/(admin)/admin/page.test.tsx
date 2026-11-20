import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminMetricasPage from "./page";

vi.mock("@/components/dashboard/usage-queries", () => ({
  useLearningQuery: () => ({ isPending: true, data: undefined }),
  REFRESH_MS: 30_000,
}));
vi.mock("@/components/dashboard/kpi-card", () => ({
  metricTone: () => "neutral",
}));
vi.mock("@/components/dashboard/usage-resumen", () => ({
  ResumenTab: () => <div>ResumenTab</div>,
}));
vi.mock("@/components/dashboard/usage-growth", () => ({
  GrowthTab: () => <div>GrowthTab</div>,
}));
vi.mock("@/components/dashboard/usage-infra", () => ({
  InfraTab: () => <div>InfraTab</div>,
}));
vi.mock("@/components/dashboard/usage-learning", () => ({
  LearningTab: () => <div>LearningTab</div>,
}));
vi.mock("@/components/dashboard/usage-usuarios", () => ({
  UsersTab: () => <div>UsersTab</div>,
}));
vi.mock("@/components/dashboard/datetime-range-picker", () => ({
  DatetimeRangePicker: () => <div>DatetimeRangePicker</div>,
}));
vi.mock("@/components/dashboard/metrics-tabs", () => ({
  MetricsTabs: ({ tabs }: { tabs: { key: string; label: string }[] }) => (
    <div>{tabs.map((t) => t.label).join(", ")}</div>
  ),
}));
vi.mock("@/components/dashboard/ui", () => ({
  PageHeading: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("@/lib/datetime-range", () => ({
  DEFAULT_SELECTION: { kind: "rolling", amount: 24, unit: "hour" },
  resolveRange: () => ({
    from: "2024-01-01T00:00:00Z",
    to: "2024-01-02T00:00:00Z",
  }),
  deriveStepSeconds: () => 60,
}));

describe("AdminMetricasPage", () => {
  afterEach(cleanup);

  it("renders the Métricas heading", () => {
    render(<AdminMetricasPage />);
    expect(screen.getByRole("heading", { name: "Métricas" })).toBeInTheDocument();
  });

  it("shows the five metric tabs", () => {
    render(<AdminMetricasPage />);
    expect(
      screen.getByText(/Resumen.*Negocio.*Usuarios.*Aprendizaje.*Infraestructura/),
    ).toBeInTheDocument();
  });
});
