import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PurchaseDetailPage from "@/app/(dashboard)/dashboard/purchases/[purchaseId]/page";
import { ApiError } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import type { PurchaseDetail, Seat } from "@/lib/api/types";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ purchaseId: "p1" }),
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));
vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({ organization: { id: "org1", name: "Hospital", status: "ACTIVE" } }),
}));
vi.mock("@/lib/api/organizations", () => ({
  organizationsApi: {
    purchase: vi.fn(),
    updateSeatEmail: vi.fn(),
    remindSeat: vi.fn(),
    cancelPurchase: vi.fn(),
    checkout: vi.fn(),
    syncPayment: vi.fn(),
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
      listPricePerSeat: 15000,
      discountPercent: 0,
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
    vi.mocked(organizationsApi.syncPayment).mockReset();
    navigation.search = "";
    navigation.replace.mockReset();
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

  it("sends the admin to Mercado Pago to pay", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    vi.mocked(organizationsApi.purchase).mockResolvedValue(
      detail({ status: "PENDING_PAYMENT", paidAt: null, invitationDeadline: null }, [
        seat({ status: "PENDING_PAYMENT", invitedAt: null, nextReminderAvailableAt: null }),
      ]),
    );
    vi.mocked(organizationsApi.checkout).mockResolvedValue({ checkoutUrl: "https://mp/checkout" });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /con Mercado Pago/ }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://mp/checkout"));
    expect(organizationsApi.checkout).toHaveBeenCalledWith("org1", "p1");
    vi.unstubAllGlobals();
  });

  it("syncs the payment when coming back from Mercado Pago", async () => {
    navigation.search = "pago=aprobado&payment_id=987&status=approved";
    const paid = detail({}, [seat({ id: "s1" })]);
    vi.mocked(organizationsApi.purchase).mockResolvedValueOnce(
      detail({ status: "PENDING_PAYMENT", paidAt: null, invitationDeadline: null }, [
        seat({ status: "PENDING_PAYMENT", invitedAt: null, nextReminderAvailableAt: null }),
      ]),
    );
    vi.mocked(organizationsApi.purchase).mockResolvedValue(paid);
    vi.mocked(organizationsApi.syncPayment).mockResolvedValue({
      paymentStatus: "approved",
      purchase: paid,
    });
    renderPage();

    expect(
      await screen.findByText("¡Listo! Recibimos el pago y mandamos las invitaciones por email."),
    ).toBeInTheDocument();
    expect(organizationsApi.syncPayment).toHaveBeenCalledWith("org1", "p1", "987");
    expect(navigation.replace).toHaveBeenCalledWith("/dashboard/purchases/p1", { scroll: false });
    expect(screen.queryByText("Cancelar compra")).not.toBeInTheDocument();
  });

  it("tells the admin when Mercado Pago did not approve the payment", async () => {
    navigation.search = "pago=rechazado&payment_id=null";
    vi.mocked(organizationsApi.purchase).mockResolvedValue(
      detail({ status: "PENDING_PAYMENT", paidAt: null, invitationDeadline: null }, [
        seat({ status: "PENDING_PAYMENT", invitedAt: null, nextReminderAvailableAt: null }),
      ]),
    );
    renderPage();

    expect(await screen.findByText(/Mercado Pago no aprobó el pago/)).toBeInTheDocument();
    expect(organizationsApi.syncPayment).not.toHaveBeenCalled();
    expect(screen.getByText("Cancelar compra")).toBeInTheDocument();
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
