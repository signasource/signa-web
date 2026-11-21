import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GrowthTab } from "@/components/dashboard/usage-growth";
import type { GrowthMetrics, Sale, SalesMetrics } from "@/lib/api/metrics";

type QueryState<T> = { isPending: boolean; data: T | undefined };

const queries = vi.hoisted(() => ({
  growth: { isPending: false, data: undefined } as QueryState<unknown>,
  sales: { isPending: false, data: undefined } as QueryState<unknown>,
  previousSales: { isPending: false, data: undefined } as QueryState<unknown>,
}));

vi.mock("@/components/dashboard/usage-queries", () => ({
  useGrowthQuery: () => queries.growth,
  // The tab asks for the window first, then the previous window (for the deltas).
  useSalesQuery: (range: { from: string } | null) =>
    range?.from === "2026-11-14T00:00:00.000Z" ? queries.sales : queries.previousSales,
}));
// Recharts needs a real layout; the chart has its own tests.
vi.mock("@/components/dashboard/revenue-by-source-chart", () => ({
  RevenueBySourceChart: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock("@/components/dashboard/breakdown-pie", () => ({
  BreakdownPie: ({
    title,
    items,
  }: {
    title: string;
    items: { label: string; value: number }[];
  }) => (
    <section aria-label={title}>
      <h3>{title}</h3>
      {items.map((i) => (
        <p key={i.label}>
          {i.label}: {i.value}
        </p>
      ))}
    </section>
  ),
}));

const RANGE = { from: "2026-11-14T00:00:00.000Z", to: "2026-11-21T00:00:00.000Z" };

function sale(overrides: Partial<Sale>): Sale {
  return {
    id: "s",
    type: "SEATS",
    productName: "LSA Salud",
    productDetail: "1 cupos × 30 días",
    buyerName: "Hospital Central",
    courseId: "c1",
    amount: 1000,
    currency: "ARS",
    paidAt: "2026-11-15T12:00:00Z",
    refunded: false,
    refundedAt: null,
    refundReason: null,
    ...overrides,
  };
}

const SALES: SalesMetrics = {
  sales: [
    sale({ id: "a", type: "SEATS", amount: 30000, buyerName: "Hospital Central" }),
    sale({ id: "b", type: "GEMS", courseId: null, amount: 10000, buyerName: "Ana Pérez" }),
    sale({
      id: "c",
      type: "COURSE",
      amount: 9000,
      buyerName: "Juan Gómez",
      refunded: true,
      refundedAt: "2026-11-16T12:00:00Z",
      refundReason: "MISTAKE",
    }),
    sale({ id: "d", type: "COURSE", amount: 9000, buyerName: "Laura Díaz" }),
  ],
  refundReasons: [{ reason: "MISTAKE", count: 1, amount: 9000 }],
  popularCourses: [
    { courseId: "c2", courseName: "LSA Inicial", orgSeats: 0, individual: 12, total: 12 },
    { courseId: "c1", courseName: "LSA Salud", orgSeats: 4, individual: 1, total: 5 },
  ],
  gemSources: [
    { source: "CHALLENGES", gems: 120 },
    { source: "ACHIEVEMENTS", gems: 50 },
    { source: "PURCHASED", gems: 500 },
  ],
  courseRevenue: [
    {
      courseId: "c1",
      courseName: "LSA Salud",
      orgAmount: 30000,
      individualAmount: 9000,
      total: 39000,
      purchases: 2,
    },
  ],
};

const GROWTH = {
  seats: { sold: 10, active: 4, utilizationPercent: 40, previousUtilizationPercent: null },
  revenue: { dailyNet: [] },
  gems: { dailyNet: [] },
  courseSales: { dailyNet: [] },
  organizations: [{ key: "ACTIVE", count: 3 }],
  orgs: { pending: 0, oldestPendingCreatedAt: null, avgUsersPerOrg: 5, utilization: [] },
} as unknown as GrowthMetrics;

function renderTab() {
  return render(<GrowthTab range={RANGE} live={false} onSelectRange={() => {}} />);
}

describe("GrowthTab (Negocio)", () => {
  beforeEach(() => {
    queries.growth = { isPending: false, data: GROWTH };
    queries.sales = { isPending: false, data: SALES };
    queries.previousSales = { isPending: false, data: { ...SALES, sales: [] } };
  });
  afterEach(cleanup);

  it("shows the money counters worked out from the window's purchases, without hints", () => {
    renderTab();
    // 30 000 + 10 000 + 9 000 (the refunded course order is left out).
    expect(screen.getByText("$49 k")).toBeInTheDocument();
    // 1 refunded of 4 purchases, by count.
    expect(screen.getByText("25,0%")).toBeInTheDocument();
    for (const hint of [
      "Orgs 61% · usuarios finales 39%",
      "1 de 4 compras",
      "1 compra reembolsada",
    ]) {
      expect(screen.queryByText(hint)).not.toBeInTheDocument();
    }
  });

  it("pairs each counter with its breakdown, in order", () => {
    renderTab();
    const order = [
      "Ingresos",
      "Ingresos por fuente",
      "Tasa de reembolsos",
      "Motivos de reembolso",
      "Origen de las gemas",
      "Cursos más populares",
      "Ingresos por curso",
    ].map((t) => screen.getAllByText(t, { exact: true })[0]!);
    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    expect(screen.getByText("Compré por error: 1")).toBeInTheDocument();
    const gems = screen.getByRole("region", { name: "Origen de las gemas" });
    expect(within(gems).getByText("Desafíos: 120")).toBeInTheDocument();
    expect(within(gems).getByText("Logros: 50")).toBeInTheDocument();
    expect(within(gems).getByText("Compradas: 500")).toBeInTheDocument();
    const popular = screen.getByText("Cursos más populares").closest("div.flex")!.parentElement!;
    const rows = within(popular).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("LSA Inicial01212");
    expect(rows[2]).toHaveTextContent("LSA Salud415");
    expect(screen.getByText("$ 39.000")).toBeInTheDocument();
  });

  it("drops the metrics that were taken out", () => {
    renderTab();
    for (const gone of [
      "Uso de cupos",
      "Dinero reembolsado",
      "Licencias por organización",
      "Usuarios promedio por organización",
      "Pendientes",
      "Gestionar",
      "Ticket promedio org.",
      "Usuarios finales",
      "Recompra (2+ compras)",
      "Ingresos netos",
    ]) {
      expect(screen.queryByText(gone, { exact: true })).not.toBeInTheDocument();
    }
  });

  it("opens the purchases behind Ingresos and the refunded ones behind the rate", () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Ver las compras: Ingresos" }));
    let dialog = screen.getByRole("dialog", { name: "Compras que suman a los ingresos" });
    expect(within(dialog).getByText("Hospital Central")).toBeInTheDocument();
    expect(within(dialog).queryByText("Juan Gómez")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Total (3)")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver las compras: Tasa de reembolsos" }));
    dialog = screen.getByRole("dialog", { name: "Compras reembolsadas" });
    expect(within(dialog).getByText("Juan Gómez")).toBeInTheDocument();
    expect(within(dialog).queryByText("Hospital Central")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Compré por error")).toBeInTheDocument();
    expect(within(dialog).getByText("Total (1)")).toBeInTheDocument();
  });

  it("shows loading and error states for the sales detail without hiding the rest", () => {
    queries.sales = { isPending: true, data: undefined };
    const { unmount } = renderTab();
    expect(screen.getAllByText("Cargando ventas…").length).toBeGreaterThan(0);
    expect(screen.getByText("Ingresos por fuente")).toBeInTheDocument();
    unmount();

    queries.sales = { isPending: false, data: undefined };
    renderTab();
    expect(screen.getAllByText("No pudimos cargar las ventas del período.").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Ingresos por fuente")).toBeInTheDocument();
  });

  it("shows the tab's own loading and error states", () => {
    queries.growth = { isPending: true, data: undefined };
    const { unmount } = renderTab();
    expect(screen.getByText("Cargando métricas de negocio…")).toBeInTheDocument();
    unmount();
    queries.growth = { isPending: false, data: undefined };
    renderTab();
    expect(screen.getByText("No pudimos cargar las métricas de negocio.")).toBeInTheDocument();
  });

  it("says so when there is nothing to rank", () => {
    queries.sales = {
      isPending: false,
      data: {
        sales: [],
        refundReasons: [],
        popularCourses: [],
        courseRevenue: [],
        gemSources: [],
      },
    };
    renderTab();
    expect(screen.getByText("Nadie se sumó a un curso en este período.")).toBeInTheDocument();
    expect(screen.getByText("Ningún curso generó ingresos en este período.")).toBeInTheDocument();
    // No purchases: the refund rate has no denominator.
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
