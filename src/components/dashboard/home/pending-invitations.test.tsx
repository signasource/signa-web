import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PendingInvitationsCard } from "@/components/dashboard/home/pending-invitations";
import { organizationsApi } from "@/lib/api/organizations";
import type { OrganizationInvitation } from "@/lib/api/types";

vi.mock("@/lib/api/organizations", () => ({
  organizationsApi: { invitationSummary: vi.fn(), invitations: vi.fn(), remindSeat: vi.fn() },
}));

function invitation(email: string, invitationDeadline: string): OrganizationInvitation {
  return {
    purchaseId: "p1",
    courseId: "c",
    courseName: "LSA Salud",
    purchaseStatus: "PAID",
    invitationDeadline,
    seat: {
      id: email,
      email,
      status: "INVITED",
      invitedAt: "2026-11-10T12:00:00Z",
      lastReminderAt: null,
      autoReminderSentAt: null,
      activatedAt: null,
      accessExpiresAt: null,
      revokedAt: null,
      userId: null,
      userName: null,
      canEditEmail: true,
      nextReminderAvailableAt: null,
    },
  };
}

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PendingInvitationsCard orgId="org1" />
    </QueryClientProvider>,
  );
}

describe("PendingInvitationsCard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the pending count and the acceptance rate", async () => {
    vi.mocked(organizationsApi.invitationSummary).mockResolvedValue({
      sent: 4,
      accepted: 3,
      pending: 1,
      acceptancePercentage: 75,
    });
    renderCard();

    expect(await screen.findByText("Tasa de aceptación: 75% (3 de 4)")).toBeTruthy();
  });

  it("lists the invitations about to expire first and reminds one", async () => {
    vi.mocked(organizationsApi.invitationSummary).mockResolvedValue({
      sent: 2,
      accepted: 0,
      pending: 2,
      acceptancePercentage: 0,
    });
    vi.mocked(organizationsApi.invitations).mockResolvedValue([
      invitation("late@x.com", "2999-02-01T12:00:00Z"),
      invitation("soon@x.com", "2999-01-01T12:00:00Z"),
    ]);
    vi.mocked(organizationsApi.remindSeat).mockResolvedValue(
      {} as Awaited<ReturnType<typeof organizationsApi.remindSeat>>,
    );
    renderCard();

    await screen.findByText(/Tasa de aceptación/);
    fireEvent.click(screen.getByRole("button", { name: /Invitaciones pendientes/ }));
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText("soon@x.com");
    const rows = within(dialog).getAllByRole("listitem");
    expect(rows.map((row) => within(row).getByRole("link").textContent)).toEqual([
      "soon@x.com",
      "late@x.com",
    ]);

    fireEvent.click(within(rows[0]!).getByRole("button", { name: /Enviar recordatorio/ }));
    await waitFor(() =>
      expect(organizationsApi.remindSeat).toHaveBeenCalledWith("org1", "p1", "soon@x.com"),
    );
  });

  it("says when nothing was sent yet", async () => {
    vi.mocked(organizationsApi.invitationSummary).mockResolvedValue({
      sent: 0,
      accepted: 0,
      pending: 0,
      acceptancePercentage: 0,
    });
    renderCard();

    expect(await screen.findByText("Todavía no enviaste invitaciones")).toBeTruthy();
  });
});
