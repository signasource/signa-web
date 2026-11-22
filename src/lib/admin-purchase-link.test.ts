import { describe, expect, it } from "vitest";
import { adminPurchaseHref, purchaseFromSearch } from "@/lib/admin-purchase-link";

describe("admin purchase link", () => {
  it("round-trips a purchase through the URL", () => {
    const href = adminPurchaseHref("a1b2", "GEMS");
    expect(href).toBe("/admin/purchases?purchase=a1b2&type=GEMS");
    expect(purchaseFromSearch(href.split("?")[1]!)).toEqual({ id: "a1b2", type: "GEMS" });
  });

  it("falls back to the list without a valid purchase", () => {
    expect(purchaseFromSearch("")).toBeNull();
    expect(purchaseFromSearch("?purchase=a1b2")).toBeNull();
    expect(purchaseFromSearch("?purchase=a1b2&type=OTHER")).toBeNull();
  });
});
