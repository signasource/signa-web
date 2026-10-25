import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import { sessionApi } from "@/lib/api/session";
import { tokenStore } from "@/lib/api/token-store";

let pathname = "/dashboard";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/lib/api/organizations", () => ({ organizationsApi: { me: vi.fn() } }));
vi.mock("@/lib/api/session", () => ({ sessionApi: { login: vi.fn(), logout: vi.fn() } }));
vi.mock("@/lib/api/token-store", () => ({ tokenStore: { hasSession: vi.fn() } }));

function Status() {
  const { status, organization } = useAuth();
  return (
    <p>
      {status}:{organization?.status ?? "none"}
    </p>
  );
}

const ORG = {
  id: "o",
  name: "Hospital",
  status: "PENDING" as const,
  role: "ADMIN" as const,
  joinedAt: "2026-10-01T00:00:00Z",
  courses: [],
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.mocked(sessionApi.logout).mockReset();
    vi.mocked(organizationsApi.me).mockReset();
    vi.mocked(tokenStore.hasSession).mockReturnValue(true);
  });
  afterEach(cleanup);

  it("restores the organization admin session", async () => {
    pathname = "/dashboard";
    vi.mocked(organizationsApi.me).mockResolvedValue(ORG);
    render(
      <AuthProvider>
        <Status />
      </AuthProvider>,
    );
    expect(await screen.findByText("authenticated:PENDING")).toBeInTheDocument();
  });

  it("leaves the SIGNA back-office session alone", async () => {
    pathname = "/admin/organizations";
    render(
      <AuthProvider>
        <Status />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("loading:none")).toBeInTheDocument());
    expect(organizationsApi.me).not.toHaveBeenCalled();
    expect(sessionApi.logout).not.toHaveBeenCalled();
  });

  it("refreshes the organization to pick up its validation", async () => {
    pathname = "/dashboard";
    vi.mocked(organizationsApi.me)
      .mockResolvedValueOnce(ORG)
      .mockResolvedValueOnce({ ...ORG, status: "ACTIVE" });
    function Refresh() {
      const { refreshOrganization } = useAuth();
      return <button onClick={() => void refreshOrganization()}>refrescar</button>;
    }
    render(
      <AuthProvider>
        <Status />
        <Refresh />
      </AuthProvider>,
    );
    await screen.findByText("authenticated:PENDING");
    fireEvent.click(screen.getByText("refrescar"));
    expect(await screen.findByText("authenticated:ACTIVE")).toBeInTheDocument();
  });
});
