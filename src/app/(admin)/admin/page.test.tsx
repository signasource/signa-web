import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminResumenPage from "./page";

const learning = vi.hoisted(() => ({
  state: { isPending: true, data: undefined } as { isPending: boolean; data: unknown },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => ({
    data:
      queryKey[1] === "stats"
        ? {
            activeOrganizations: 2,
            pendingOrganizations: 0,
            openSignReports: 1,
            totalSigns: 132,
            totalUsers: 11,
          }
        : undefined,
  }),
}));
vi.mock("@/components/dashboard/usage-queries", () => ({
  useLearningQuery: () => learning.state,
}));
vi.mock("@/features/admin/admin-auth-context", () => ({
  useAdminAuth: () => ({ admin: { name: "Agus" } }),
}));

const LEARNING = {
  onboardingFunnel: [
    { key: "Usuarios registrados", count: 1250 },
    { key: "Iniciaron una lección", count: 800 },
  ],
  reports: {
    resolvedCount: 3,
    averageResolutionHours: 5,
    mostReported: [{ meaning: "hola", count: 4 }],
    mostReportedPending: [{ meaning: "chau", count: 1 }],
  },
};

describe("AdminResumenPage", () => {
  afterEach(cleanup);

  it("counts registered users from the funnel and shows the funnel and sign reports", () => {
    learning.state = { isPending: false, data: LEARNING };
    render(<AdminResumenPage />);
    expect(screen.getByText("Usuarios registrados", { selector: "p" })).toBeInTheDocument();
    expect(screen.getAllByText("1.250").length).toBeGreaterThan(0);
    expect(screen.getByText("Embudo de aprendizaje")).toBeInTheDocument();
    expect(screen.getByText("Reportes de señas")).toBeInTheDocument();
    expect(screen.getByText("chau")).toBeInTheDocument();
  });

  it("shows loading, then an error, while the history is not there", () => {
    learning.state = { isPending: true, data: undefined };
    render(<AdminResumenPage />);
    expect(screen.getByText("Cargando embudo y reportes…")).toBeInTheDocument();
    cleanup();
    learning.state = { isPending: false, data: undefined };
    render(<AdminResumenPage />);
    expect(screen.getByText("No pudimos cargar el embudo ni los reportes.")).toBeInTheDocument();
  });
});
