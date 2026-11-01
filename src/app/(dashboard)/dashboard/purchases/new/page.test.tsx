import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NewPurchasePage from "@/app/(dashboard)/dashboard/purchases/new/page";
import { ApiError } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import type { PurchaseCatalog, PurchaseDetail, PurchaseQuote } from "@/lib/api/types";

vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({ organization: { id: "org1", name: "Hospital", status: "ACTIVE" } }),
}));
vi.mock("@/lib/api/organizations", () => ({
  organizationsApi: {
    catalog: vi.fn(),
    quote: vi.fn(),
    createPurchase: vi.fn(),
    checkout: vi.fn(),
  },
}));

const catalog: PurchaseCatalog = {
  courses: [
    {
      id: "salud",
      code: "salud",
      name: "LSA Salud",
      description: null,
      coverUrl: null,
      signCount: 3,
      modules: [
        { title: "Urgencias", signs: ["Dolor", "Fiebre"] },
        { title: "Turnos", signs: ["Turno"] },
      ],
    },
    {
      id: "educacion",
      code: "educacion",
      name: "LSA Educación",
      description: "Para escuelas.",
      coverUrl: null,
      signCount: 1,
      modules: [{ title: "Aula", signs: ["Pizarrón"] }],
    },
  ],
  currency: "ARS",
  volumeDiscounts: [{ minSeats: 3, percent: 10 }],
  minDays: 15,
  maxDays: 60,
  invitationDays: 10,
  maxSeats: 500,
};

function quoteFor({
  courseId,
  seats,
  durationDays,
}: {
  courseId: string;
  seats: number;
  durationDays: number;
}): PurchaseQuote {
  const discountPercent = seats >= 3 ? 10 : 0;
  const pricePerSeat = 10000 * (1 - discountPercent / 100);
  return {
    courseId,
    courseName: courseId === "salud" ? "LSA Salud" : "LSA Educación",
    signCount: courseId === "salud" ? 3 : 1,
    seats,
    durationDays,
    listPricePerSeat: 10000,
    discountPercent,
    pricePerSeat,
    subtotal: 10000 * seats,
    discountAmount: (10000 - pricePerSeat) * seats,
    totalAmount: pricePerSeat * seats,
    currency: "ARS",
  };
}

const created = { purchase: { id: "p1" } } as PurchaseDetail;

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NewPurchasePage />
    </QueryClientProvider>,
  );
}

async function fillEmails(value: string) {
  fireEvent.change(await screen.findByLabelText(/Un email por cupo/), { target: { value } });
}

describe("NewPurchasePage", () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.mocked(organizationsApi.catalog).mockResolvedValue(catalog);
    vi.mocked(organizationsApi.quote).mockImplementation(async (params) => quoteFor(params));
    vi.mocked(organizationsApi.createPurchase).mockReset();
    vi.mocked(organizationsApi.checkout).mockReset();
    assign.mockReset();
    vi.stubGlobal("location", { ...window.location, assign });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the signs of the chosen course", async () => {
    renderPage();

    const signs = await screen.findByText("Señas que incluye LSA Salud");
    const card = signs.closest("div")!.parentElement!;
    expect(within(card).getByRole("region", { name: "Urgencias" })).toHaveTextContent("Dolor");
    expect(within(card).getByText("Turno")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /LSA Educación/ }));
    expect(await screen.findByText("Señas que incluye LSA Educación")).toBeInTheDocument();
    expect(screen.getByText("Pizarrón")).toBeInTheDocument();
    expect(screen.queryByText("Dolor")).not.toBeInTheDocument();
  });

  it("suggests the next volume discount", async () => {
    renderPage();
    await fillEmails("a@x.com\nb@x.com");

    expect(
      await screen.findByText("Sumá 1 cupo más y tenés 10% de descuento en cada cupo."),
    ).toBeInTheDocument();
  });

  it("shows the summary before paying and then goes to Mercado Pago", async () => {
    vi.mocked(organizationsApi.createPurchase).mockResolvedValue(created);
    vi.mocked(organizationsApi.checkout).mockResolvedValue({ checkoutUrl: "https://mp/checkout" });
    renderPage();
    await fillEmails("a@x.com, b@x.com, c@x.com");
    fireEvent.click(screen.getByRole("button", { name: "Revisar la compra" }));

    expect(await screen.findByText("Resumen de la compra")).toBeInTheDocument();
    expect(organizationsApi.createPurchase).not.toHaveBeenCalled();
    expect(screen.getByText("LSA Salud")).toBeInTheDocument();
    expect(screen.getByText("3 cupos")).toBeInTheDocument();
    expect(screen.getByText("30 días por persona")).toBeInTheDocument();
    expect(screen.getByText("Descuento por volumen (10%)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver las señas" }));
    expect(screen.getByText("Fiebre")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Pagar/ }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://mp/checkout"));
    expect(organizationsApi.createPurchase).toHaveBeenCalledWith("org1", {
      courseId: "salud",
      durationDays: 30,
      emails: ["a@x.com", "b@x.com", "c@x.com"],
    });
    expect(organizationsApi.checkout).toHaveBeenCalledWith("org1", "p1");
  });

  it("goes back to edit from the summary", async () => {
    renderPage();
    await fillEmails("a@x.com");
    fireEvent.click(screen.getByRole("button", { name: "Revisar la compra" }));
    fireEvent.click(await screen.findByRole("button", { name: "Volver y editar" }));

    expect(await screen.findByLabelText(/Un email por cupo/)).toHaveValue("a@x.com");
  });

  it("does not create the purchase twice when Mercado Pago fails", async () => {
    vi.mocked(organizationsApi.createPurchase).mockResolvedValue(created);
    vi.mocked(organizationsApi.checkout)
      .mockRejectedValueOnce(new ApiError(503, "down"))
      .mockResolvedValue({ checkoutUrl: "https://mp/checkout" });
    renderPage();
    await fillEmails("a@x.com");
    fireEvent.click(screen.getByRole("button", { name: "Revisar la compra" }));
    fireEvent.click(await screen.findByRole("button", { name: /^Pagar/ }));

    expect(
      await screen.findByText(/Guardamos la compra, pero no pudimos abrir/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Volver y editar" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al detalle de la compra" })).toHaveAttribute(
      "href",
      "/dashboard/purchases/p1",
    );

    fireEvent.click(screen.getByRole("button", { name: /^Pagar/ }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://mp/checkout"));
    expect(organizationsApi.createPurchase).toHaveBeenCalledTimes(1);
  });

  it("explains a conflict with an email that already has a seat", async () => {
    vi.mocked(organizationsApi.createPurchase).mockRejectedValue(new ApiError(409, "taken"));
    renderPage();
    await fillEmails("a@x.com");
    fireEvent.click(screen.getByRole("button", { name: "Revisar la compra" }));
    fireEvent.click(await screen.findByRole("button", { name: /^Pagar/ }));

    expect(
      await screen.findByText(
        "Alguno de esos emails ya tiene un cupo pendiente o vigente para este curso.",
      ),
    ).toBeInTheDocument();
    expect(organizationsApi.checkout).not.toHaveBeenCalled();
  });
});
