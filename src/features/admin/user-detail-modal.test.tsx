import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserDetailModal } from "@/features/admin/user-detail-modal";
import { adminApi, type AdminUser } from "@/lib/api/admin";

const auth = vi.hoisted(() => ({ adminId: "admin-1" }));

vi.mock("@/features/admin/admin-auth-context", () => ({
  useAdminAuth: () => ({ admin: { id: auth.adminId } }),
}));
vi.mock("@/lib/api/admin", () => ({
  adminApi: {
    updateUser: vi.fn().mockResolvedValue({}),
    deleteUser: vi.fn().mockResolvedValue(undefined),
  },
}));

const user: AdminUser = {
  id: "user-1",
  email: "ana@test.com",
  username: "ana",
  name: "Ana",
  lastName: "Paz",
  role: "USER",
  enabled: true,
  verified: true,
  organizationName: null,
  authProvider: "EMAIL",
  currentStreak: 0,
  lastStreakDate: null,
  avatar: null,
};

function renderModal(target: AdminUser = user) {
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <UserDetailModal user={target} onClose={onClose} />
    </QueryClientProvider>,
  );
  return onClose;
}

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("UserDetailModal", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    auth.adminId = "admin-1";
  });

  it("disables an account after confirming", async () => {
    const onClose = renderModal();
    click("Deshabilitar cuenta");
    click("Confirmar");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(adminApi.updateUser).toHaveBeenCalledWith("user-1", { enabled: false });
  });

  it("offers to re-enable a disabled account", async () => {
    const onClose = renderModal({ ...user, enabled: false });
    expect(screen.getByText("Deshabilitada")).toBeTruthy();
    click("Rehabilitar cuenta");
    click("Confirmar");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(adminApi.updateUser).toHaveBeenCalledWith("user-1", { enabled: true });
  });

  it("deletes an account after confirming", async () => {
    const onClose = renderModal();
    click("Eliminar cuenta");
    expect(screen.getByText(/No se puede deshacer/)).toBeTruthy();
    click("Confirmar");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(adminApi.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("does nothing when the confirmation is cancelled", () => {
    renderModal();
    click("Eliminar cuenta");
    click("Cancelar");
    expect(adminApi.deleteUser).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Eliminar cuenta" })).toBeTruthy();
  });

  it("offers no actions on your own account", () => {
    auth.adminId = "user-1";
    renderModal();
    expect(screen.queryByRole("button", { name: "Eliminar cuenta" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Deshabilitar cuenta" })).toBeNull();
  });
});
