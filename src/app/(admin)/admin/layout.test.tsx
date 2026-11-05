import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "./layout";

const replace = vi.fn();
const navigation = vi.hoisted(() => ({ pathname: "/admin/login" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace }),
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: undefined }) }));
vi.mock("@/features/admin/admin-auth-context", () => ({
  useAdminAuth: () => ({ status: "unauthenticated", admin: null, logout: vi.fn() }),
}));

describe("AdminLayout", () => {
  beforeEach(() => replace.mockClear());

  it("stays on the login page when unauthenticated, keeping it mounted", () => {
    navigation.pathname = "/admin/login";
    render(
      <AdminLayout>
        <p>login</p>
      </AdminLayout>,
    );
    expect(screen.getByText("login")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends an unauthenticated visitor from another page to the login", () => {
    navigation.pathname = "/admin/organizations";
    render(
      <AdminLayout>
        <p>private</p>
      </AdminLayout>,
    );
    expect(screen.queryByText("private")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/admin/login");
  });
});
