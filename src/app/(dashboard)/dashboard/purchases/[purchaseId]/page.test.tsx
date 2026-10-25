import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PurchaseDetailPage from "@/app/(dashboard)/dashboard/purchases/[purchaseId]/page";
import { ApiError } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import type { PurchaseDetail, Seat } from "@/lib/api/types";

vi.mock("next/navigation", () => ({ useParams: () => ({ purchaseId: "p1" }) }));
vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({ organization: { id: "org1", name: "Hospital", status: "ACTIVE" } }),
}));
vi.mock("@/lib/api/organizations", () => ({
  organizationsApi: {
    purchase: vi.fn(),
    updateSeatEmail: vi.fn(),
    remindSeat: vi.fn(),
    cancelPurchase: vi.fn(),
  },
}));

function seat(overrides: Partial<Seat>): Seat {
  return {
    id: "s",
    email: "a@x.com",
    status: "INVITED",
    invitedAt: "2026-10-20T12:00:00Z",
    lastReminderAt: null,
    autoReminderSentAt: null,
    activatedAt: null,
    accessExpiresAt: null,
    revokedAt: null,
    userId: null,
    userName: null,
    canEditEmail: true,
    nextReminderAvailableAt: "2026-10-21T12:00:00Z",
    ...overrides,
  };
}

function detail(overrides: Partial<PurchaseDetail["purchase"]> = {}, seats: Seat[] = []) {
  return {
    purchase: {
      id: "p1",
      courseId: "c",
      courseName: "LSA Salud",
      seats: seats.length,
      durationDays: 30,
      signCount: 100,
      pricePerSeat: 15000,
      totalAmount: 15000 * seats.length,
      currency: "ARS",
      status: "PAID" as const,
      createdAt: "2026-10-20T10:00:00Z",
      paidAt: "2026-10-20T12:00:00Z",
      invitationDeadline: "2026-10-30T12:00:00Z",
      cancelledAt: null,
      seatCounts: {
        pendingPayment: 0,
        invited: 1,
        invitationExpired: 0,
        active: 1,
        accessExpired: 0,
        revoked: 0,
      },
      ...overrides,
    },
    seats,
  };
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PurchaseDetailPage />
    </QueryClientProvider>,
  );
}

describe("PurchaseDetailPage", () => {
  beforeEach(() => {
    vi.mocked(organizationsApi.purchase).mockReset();
  });
  afterEach(cleanup);

  it("lists the seats with their state and filters them", async () => {
    vi.mocked(organizationsApi.purchase).mockResolvedValue(
      detail({}, [
        seat({ id: "s1", email: "ana@x.com" }),
        seat({
          id: "s2",
          email: "bruno@x.com",
          status: "ACTIVE",
          userId: "u2",
          userName: "Bruno Díaz",
          canEditEmail: false,
          activatedAt: "2026-10-21T12:00:00Z",
          accessExpiresAt: "2026-11-20T12:00:00Z",
          nextReminderAvailableAt: null,
        }),
      ]),
    );
    renderPage();

    expect(await screen.findByText("ana@x.com")).toBeInTheDocument();
    expect(screen.getByText("Bruno Díaz · bruno@x.com")).toBeInTheDocument();
    expect(screen.getAllByText("Cambiar email")).toHaveLength(1);
    expect(screen.getByText("Ver avance")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sin aceptar" }));
    expect(screen.queryByText("Bruno Díaz · bruno@x.com")).not.toBeInTheDocument();
  });

  it("offers cancelling while the purchase is unpaid", async () => {
    vi.mocked(organizationsApi.purchase).mockResolvedValue(
      detail({ status: "PENDING_PAYMENT", paidAt: null, invitationDeadline: null }, [
        seat({ status: "PENDING_PAYMENT", invitedAt: null, nextReminderAvailableAt: null }),
      ]),
    );
    renderPage();

    expect(await screen.findByText("Cancelar compra")).toBeInTheDocument();
    expect(screen.queryByText("Recordar")).not.toBeInTheDocument();
  });

  it("changes a pending email", async () => {
    vi.mocked(organizationsApi.purchase).mockResolvedValue(detail({}, [seat({ id: "s1" })]));
    vi.mocked(organizationsApi.updateSeatEmail).mockResolvedValue(
      detail({}, [seat({ id: "s1", email: "nueva@x.com" })]),
    );
    renderPage();

    fireEvent.click(await screen.findByText("Cambiar email"));
    fireEvent.change(screen.getByLabelText("Nuevo email"), { target: { value: "nueva@x.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(organizationsApi.updateSeatEmail).toHaveBeenCalledWith(
        "org1",
        "p1",
        "s1",
        "nueva@x.com",
      ),
    );
    expect(await screen.findByText("Guardamos el nuevo email.")).toBeInTheDocument();
  });

  it("shows an error state", async () => {
    vi.mocked(organizationsApi.purchase).mockImplementation(async () => {
      throw new ApiError(500, "boom");
    });
    renderPage();
    expect(await screen.findByText("No pudimos cargar los datos.")).toBeInTheDocument();
  });
});
