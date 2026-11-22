import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { organizationsApi } from "@/lib/api/organizations";
import type { Purchase } from "@/lib/api/types";
import PurchasesPage from "./page";

vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({ organization: { id: "org1", name: "Hospital", status: "ACTIVE" } }),
}));
vi.mock("@/lib/api/organizations", () => ({ organizationsApi: { purchases: vi.fn() } }));

function purchase(overrides: Partial<Purchase>): Purchase {
  return {
    id: "p",
    courseId: "c",
    courseName: "LSA Salud",
    seats: 3,
    durationDays: 30,
    signCount: 50,
    listPricePerSeat: 15000,
    discountPercent: 0,
    pricePerSeat: 15000,
    totalAmount: 45000,
    currency: "ARS",
    status: "PAID",
    createdAt: "2026-11-10T15:00:00Z",
    paidAt: "2026-11-10T15:05:00Z",
    invitationDeadline: "2026-11-20T15:05:00Z",
    refundableUntil: null,
    cancelledAt: null,
    refundedAt: null,
    seatCounts: {
      pendingPayment: 0,
      invited: 1,
      invitationExpired: 0,
      active: 2,
      accessExpired: 0,
      revoked: 0,
    },
    hasRefundRequest: false,
    hasAcceptedSeats: true,
    paymentMethod: "MERCADO_PAGO",
    ...overrides,
  };
}

const LIST = [
  purchase({ id: "a", courseName: "LSA Salud", createdAt: "2026-11-10T15:00:00Z" }),
  purchase({
    id: "b",
    courseName: "Curso Educación",
    status: "REFUNDED",
    createdAt: "2026-11-01T12:00:00Z",
  }),
  purchase({
    id: "c",
    courseName: "En la cafetería",
    status: "PENDING_PAYMENT",
    paidAt: null,
    createdAt: "2026-11-15T12:00:00Z",
  }),
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PurchasesPage />
    </QueryClientProvider>,
  );
}

describe("PurchasesPage", () => {
  afterEach(cleanup);

  it("lists only what each purchase is, newest first", async () => {
    vi.mocked(organizationsApi.purchases).mockResolvedValue(LIST);
    renderPage();

    expect(await screen.findByText("LSA Salud")).toBeInTheDocument();
    const rows = screen
      .getAllByRole("link")
      .filter((l) => /purchases\/[abc]$/.test(l.getAttribute("href") ?? ""));
    expect(rows.map((r) => r.getAttribute("href"))).toEqual([
      "/dashboard/purchases/c",
      "/dashboard/purchases/a",
      "/dashboard/purchases/b",
    ]);
    // Nothing about the invitations of each purchase.
    for (const gone of ["Aceptaron", "Sin aceptar", "Vencidas"]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument();
    }
    expect(screen.getByText("3 compras")).toBeInTheDocument();
  });

  it("filters by payment state and sorts by purchase date", async () => {
    vi.mocked(organizationsApi.purchases).mockResolvedValue(LIST);
    renderPage();
    await screen.findByText("LSA Salud");

    fireEvent.click(screen.getByRole("button", { name: "Reembolsado" }));
    expect(screen.getByText("Curso Educación")).toBeInTheDocument();
    expect(screen.queryByText("LSA Salud")).not.toBeInTheDocument();
    expect(screen.getByText("1 compra")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pendiente" }));
    expect(screen.getByText("En la cafetería")).toBeInTheDocument();
    expect(screen.queryByText("Curso Educación")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Todos" }));
    fireEvent.click(screen.getByRole("button", { name: /Ordenar por fecha de compra/ }));
    const rows = screen
      .getAllByRole("link")
      .filter((l) => /purchases\/[abc]$/.test(l.getAttribute("href") ?? ""));
    expect(rows[0]).toHaveAttribute("href", "/dashboard/purchases/b");
  });

  it("names the period filter after the purchase date", async () => {
    vi.mocked(organizationsApi.purchases).mockResolvedValue(LIST);
    renderPage();
    await screen.findByText("LSA Salud");
    fireEvent.click(screen.getByRole("button", { name: /Fecha de compra/ }));
    expect(screen.getByText("Filtra por el día en que se hizo la compra.")).toBeInTheDocument();
  });

  it("says when no purchase matches", async () => {
    vi.mocked(organizationsApi.purchases).mockResolvedValue([LIST[0]!]);
    renderPage();
    await screen.findByText("LSA Salud");
    fireEvent.click(screen.getByRole("button", { name: "Reembolsado" }));
    expect(screen.getByText("No hay compras con estos filtros.")).toBeInTheDocument();
  });
});
