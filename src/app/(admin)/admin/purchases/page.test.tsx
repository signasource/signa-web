import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "@/lib/api/admin";
import AdminPurchasesPage from "./page";

const search = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.value),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/admin/purchases",
}));
vi.mock("@/lib/api/admin", () => ({
  adminApi: {
    allPurchases: vi.fn(() => Promise.resolve([])),
    refundRequests: vi.fn(() => Promise.resolve([])),
    purchaseDetail: vi.fn(() => new Promise(() => {})),
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminPurchasesPage />
    </QueryClientProvider>,
  );
}

describe("AdminPurchasesPage", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(adminApi.purchaseDetail).mockClear();
  });

  it("opens the purchase a metrics link points at", async () => {
    search.value = "purchase=p1&type=GEMS";
    renderPage();
    await waitFor(() => expect(adminApi.purchaseDetail).toHaveBeenCalledWith("p1", "GEMS"));
  });

  it("shows the list without a linked purchase", async () => {
    search.value = "";
    renderPage();
    await waitFor(() => expect(adminApi.allPurchases).toHaveBeenCalled());
    expect(adminApi.purchaseDetail).not.toHaveBeenCalled();
  });
});
