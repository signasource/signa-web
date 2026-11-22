import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { organizationsApi } from "@/lib/api/organizations";
import type { Purchase } from "@/lib/api/types";
import PurchasesPage from "./page";

vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({ organization: { id: "org1", name: "Hospital", status: "ACTIVE" } }),
}));
vi.mock("@/lib/api/organizations", () => ({ organizationsApi: { purchases: vi.fn() } }));
const filter = vi.hoisted(() => ({ courseId: undefined as string | undefined }));
const COURSES = [
  { id: "salud", name: "LSA Salud" },
  { id: "edu", name: "Curso Educación" },
];
vi.mock("@/features/dashboard/use-course-filter", () => ({
  useCourseFilter: () => ({
    courses: COURSES,
    course: COURSES.find((c) => c.id === filter.courseId) ?? null,
    courseId: filter.courseId,
    setCourseId: vi.fn(),
  }),
}));

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
  purchase({
    id: "a",
    courseId: "salud",
    courseName: "LSA Salud",
    createdAt: "2026-11-10T15:00:00Z",
  }),
  purchase({
    id: "b",
    courseId: "edu",
    courseName: "Curso Educación",
    status: "REFUNDED",
    createdAt: "2026-11-01T12:00:00Z",
  }),
  purchase({
    id: "c",
    courseId: "salud",
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

const heading = () => screen.getByRole("heading", { level: 1 });

describe("PurchasesPage", () => {
  beforeEach(() => {
    filter.courseId = undefined;
  });
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
    // The count sits next to the title, not under the table.
    expect(heading()).toHaveTextContent("Compras · 3");
    expect(screen.queryByText("3 compras")).not.toBeInTheDocument();
  });

  it("filters by payment state and sorts by purchase date", async () => {
    vi.mocked(organizationsApi.purchases).mockResolvedValue(LIST);
    renderPage();
    await screen.findByText("LSA Salud");

    fireEvent.click(screen.getByRole("button", { name: "Reembolsado" }));
    expect(screen.getByText("Curso Educación")).toBeInTheDocument();
    expect(screen.queryByText("LSA Salud")).not.toBeInTheDocument();
    expect(heading()).toHaveTextContent("Compras · 1");

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

  it("filters by the course picked in the header", async () => {
    filter.courseId = "salud";
    vi.mocked(organizationsApi.purchases).mockResolvedValue(LIST);
    renderPage();
    expect(
      await screen.findByText("LSA Salud", { selector: "span.font-display" }),
    ).toBeInTheDocument();
    expect(screen.getByText("En la cafetería")).toBeInTheDocument();
    expect(
      screen.queryByText("Curso Educación", { selector: "span.font-display" }),
    ).not.toBeInTheDocument();
    expect(heading()).toHaveTextContent("Compras · 2");
    // The course chip is in the header.
    expect(screen.getByRole("button", { name: /LSA Salud/ })).toHaveAttribute(
      "aria-haspopup",
      "listbox",
    );
  });
});
