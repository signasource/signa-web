import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FollowUpCard } from "@/components/dashboard/home/follow-up-card";
import { organizationsApi } from "@/lib/api/organizations";
import type { HomeFollowUpParticipant } from "@/lib/api/types";

vi.mock("@/lib/api/organizations", () => ({
  organizationsApi: { remindMember: vi.fn() },
}));

function participant(overrides: Partial<HomeFollowUpParticipant>): HomeFollowUpParticipant {
  return {
    userId: "u1",
    name: "Ana",
    lastName: "Paz",
    avatarUrl: null,
    reasons: ["INACTIVE"],
    courses: [
      { courseId: "c", courseName: "La salud", progressPercentage: 20, accessExpiresAt: null },
    ],
    progressPercentage: 20,
    lastActivityAt: null,
    accessExpiresAt: null,
    lastReminderAt: null,
    nextReminderAvailableAt: null,
    ...overrides,
  };
}

function renderCard(participants: HomeFollowUpParticipant[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <FollowUpCard
        orgId="org1"
        participants={participants}
        homeKey={["organization", "org1", "home", null]}
        memberHref={(id) => `/dashboard/members/${id}`}
      />
    </QueryClientProvider>,
  );
}

describe("FollowUpCard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("says nobody needs follow-up", () => {
    renderCard([]);

    expect(screen.getByText(/Nadie necesita seguimiento/)).toBeTruthy();
  });

  it("shows why each person needs a nudge and sends a reminder", async () => {
    vi.mocked(organizationsApi.remindMember).mockResolvedValue({
      lastReminderAt: "2026-11-20T15:00:00Z",
      nextReminderAvailableAt: "2026-11-21T15:00:00Z",
    });
    renderCard([participant({})]);

    expect(screen.getByText("Nunca empezó")).toBeTruthy();
    expect(screen.getByText("20% completado de La salud")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Enviar recordatorio$/ }));

    await waitFor(() => expect(organizationsApi.remindMember).toHaveBeenCalledWith("org1", "u1"));
  });

  it("holds the reminder while the cooldown runs", () => {
    renderCard([participant({ nextReminderAvailableAt: "2999-01-01T00:00:00Z" })]);

    const button = screen.getByRole("button", { name: /Enviado/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("tells when the reminder failed", async () => {
    vi.mocked(organizationsApi.remindMember).mockRejectedValue(new Error("400"));
    renderCard([participant({})]);

    fireEvent.click(screen.getByRole("button", { name: /^Enviar recordatorio$/ }));

    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("reminds everyone who can get one, skipping the ones in cooldown", async () => {
    vi.mocked(organizationsApi.remindMember).mockResolvedValue({
      lastReminderAt: "2026-11-20T15:00:00Z",
      nextReminderAvailableAt: "2026-11-21T15:00:00Z",
    });
    renderCard([
      participant({ userId: "u1" }),
      participant({ userId: "u2", name: "Bruno" }),
      participant({ userId: "u3", name: "Carla", nextReminderAvailableAt: "2999-01-01T00:00:00Z" }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Enviar recordatorio a todos (2)" }));

    expect(await screen.findByText("Mandamos 2 recordatorios.")).toBeTruthy();
    expect(organizationsApi.remindMember).toHaveBeenCalledTimes(2);
    expect(organizationsApi.remindMember).not.toHaveBeenCalledWith("org1", "u3");
  });
});
