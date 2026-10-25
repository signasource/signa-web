import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InvitationPage from "@/app/(auth)/invitacion/page";
import { ApiError } from "@/lib/api/client";
import { invitationsApi } from "@/lib/api/invitations";
import { sessionApi } from "@/lib/api/session";
import type { InvitationPreview } from "@/lib/api/types";

let token = "tok";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(token ? { token } : {}),
}));
vi.mock("@/lib/api/invitations", () => ({
  invitationsApi: { preview: vi.fn(), accept: vi.fn() },
}));
vi.mock("@/lib/api/session", () => ({
  sessionApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));

const PREVIEW: InvitationPreview = {
  organizationName: "Hospital",
  courseName: "LSA Salud",
  email: "ana@hospital.com",
  status: "INVITED",
  invitationDeadline: "2026-11-04T12:00:00Z",
  durationDays: 30,
  accountExists: true,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <InvitationPage />
    </QueryClientProvider>,
  );
}

describe("InvitationPage", () => {
  beforeEach(() => {
    token = "tok";
    vi.mocked(invitationsApi.preview).mockReset();
    vi.mocked(invitationsApi.accept).mockReset();
    vi.mocked(sessionApi.login).mockReset();
    vi.mocked(sessionApi.register).mockReset();
  });
  afterEach(cleanup);

  it("asks for the link when there is no token", () => {
    token = "";
    renderPage();
    expect(screen.getByText("Falta el link de invitación")).toBeInTheDocument();
  });

  it("explains a replaced or unknown link", async () => {
    vi.mocked(invitationsApi.preview).mockRejectedValue(new ApiError(404, "not found"));
    renderPage();
    expect(await screen.findByText("Este link ya no es válido")).toBeInTheDocument();
  });

  it("explains an expired invitation", async () => {
    vi.mocked(invitationsApi.preview).mockResolvedValue({
      ...PREVIEW,
      status: "INVITATION_EXPIRED",
    });
    renderPage();
    expect(await screen.findByText("La invitación venció")).toBeInTheDocument();
  });

  it("logs in with the invited email and accepts", async () => {
    vi.mocked(invitationsApi.preview).mockResolvedValue(PREVIEW);
    vi.mocked(sessionApi.login).mockResolvedValue();
    vi.mocked(invitationsApi.accept).mockResolvedValue({
      organizationName: "Hospital",
      courseId: "c",
      courseName: "LSA Salud",
      activatedAt: "2026-10-25T12:00:00Z",
      accessExpiresAt: "2026-11-24T12:00:00Z",
    });
    renderPage();

    expect(await screen.findByText("Hospital te invitó a Signa")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Contraseña de tu cuenta de Signa"), {
      target: { value: "secreto123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión y aceptar" }));

    expect(await screen.findByText("¡Listo, ya tenés acceso!")).toBeInTheDocument();
    expect(sessionApi.login).toHaveBeenCalledWith("ana@hospital.com", "secreto123");
    expect(invitationsApi.accept).toHaveBeenCalledWith("tok");
    expect(sessionApi.logout).toHaveBeenCalled();
  });

  it("shows why the invitation could not be accepted", async () => {
    vi.mocked(invitationsApi.preview).mockResolvedValue(PREVIEW);
    vi.mocked(sessionApi.login).mockResolvedValue();
    vi.mocked(invitationsApi.accept).mockRejectedValue(new ApiError(409, "conflict"));
    renderPage();

    fireEvent.change(await screen.findByLabelText("Contraseña de tu cuenta de Signa"), {
      target: { value: "secreto123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión y aceptar" }));

    expect(
      await screen.findByText(
        "Tu cuenta ya pertenece a otra organización. Escribile a quien te invitó.",
      ),
    ).toBeInTheDocument();
  });

  it("creates the account when the email has none", async () => {
    vi.mocked(invitationsApi.preview).mockResolvedValue({ ...PREVIEW, accountExists: false });
    vi.mocked(sessionApi.register).mockResolvedValue();
    vi.mocked(invitationsApi.accept).mockResolvedValue({
      organizationName: "Hospital",
      courseId: "c",
      courseName: "LSA Salud",
      activatedAt: "2026-10-25T12:00:00Z",
      accessExpiresAt: "2026-11-24T12:00:00Z",
    });
    renderPage();

    fireEvent.change(await screen.findByLabelText("Nombre"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Apellido"), { target: { value: "Gómez" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreto123" } });
    fireEvent.change(screen.getByLabelText("Confirmá la contraseña"), {
      target: { value: "secreto123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta y aceptar" }));

    await waitFor(() => expect(invitationsApi.accept).toHaveBeenCalledWith("tok"));
    expect(vi.mocked(sessionApi.register).mock.calls[0]?.[0]).toMatchObject({
      email: "ana@hospital.com",
      name: "Ana",
      lastName: "Gómez",
    });
  });

  it("lets someone with an account switch to logging in", async () => {
    vi.mocked(invitationsApi.preview).mockResolvedValue({ ...PREVIEW, accountExists: false });
    renderPage();
    fireEvent.click(await screen.findByText("¿Ya tenés cuenta en Signa? Iniciá sesión"));
    expect(screen.getByRole("button", { name: "Iniciar sesión y aceptar" })).toBeInTheDocument();
  });
});
