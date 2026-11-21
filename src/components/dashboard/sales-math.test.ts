import { describe, expect, it } from "vitest";
import { salesForView, salesTotals } from "@/components/dashboard/sales-math";
import type { Sale } from "@/lib/api/metrics";

function sale(overrides: Partial<Sale>): Sale {
  return {
    id: "s",
    type: "SEATS",
    productName: "LSA Salud",
    productDetail: "1 cupos × 30 días",
    buyerName: "Hospital",
    courseId: "c1",
    amount: 1000,
    currency: "ARS",
    paidAt: "2026-11-10T12:00:00Z",
    refunded: false,
    refundedAt: null,
    refundReason: null,
    ...overrides,
  };
}

const SALES: Sale[] = [
  sale({ id: "org", type: "SEATS", amount: 12000, paidAt: "2026-11-10T12:00:00Z" }),
  sale({ id: "gems", type: "GEMS", courseId: null, amount: 5000, paidAt: "2026-11-12T12:00:00Z" }),
  sale({
    id: "course-refunded",
    type: "COURSE",
    amount: 9000,
    paidAt: "2026-11-11T12:00:00Z",
    refunded: true,
    refundedAt: "2026-11-13T12:00:00Z",
    refundReason: "MISTAKE",
  }),
  sale({
    id: "org-refunded",
    type: "SEATS",
    amount: 8000,
    paidAt: "2026-11-09T12:00:00Z",
    refunded: true,
    refundReason: "CHARGEBACK",
  }),
];

describe("salesTotals", () => {
  it("leaves the refunded purchases out of income and splits orgs from end users", () => {
    const t = salesTotals(SALES);
    expect(t.net).toBe(17000);
    expect(t.orgNet).toBe(12000);
    expect(t.usersNet).toBe(5000);
    expect(t.netCount).toBe(2);
  });

  it("counts the refund rate by purchases, not by money", () => {
    const t = salesTotals(SALES);
    expect(t.refundedCount).toBe(2);
    expect(t.count).toBe(4);
    expect(t.refundRate).toBe(50);
    expect(t.refunded).toBe(17000);
  });

  it("is all zeros without sales (no division by zero)", () => {
    expect(salesTotals([])).toEqual({
      count: 0,
      netCount: 0,
      net: 0,
      orgNet: 0,
      usersNet: 0,
      refunded: 0,
      refundedCount: 0,
      refundRate: 0,
    });
  });
});

describe("salesForView", () => {
  const ids = (list: Sale[]) => list.map((s) => s.id);

  it("lists what income counts, newest first, and it adds up to the counter", () => {
    const list = salesForView(SALES, "income");
    expect(ids(list)).toEqual(["gems", "org"]);
    expect(list.reduce((sum, s) => sum + s.amount, 0)).toBe(salesTotals(SALES).net);
  });

  it("lists only the refunded purchases for the refund rate", () => {
    const list = salesForView(SALES, "refund_rate");
    expect(ids(list)).toEqual(["course-refunded", "org-refunded"]);
    expect(list).toHaveLength(salesTotals(SALES).refundedCount);
    expect(list.reduce((sum, s) => sum + s.amount, 0)).toBe(salesTotals(SALES).refunded);
  });

  it("does not reorder the list it was given", () => {
    const copy = [...SALES];
    salesForView(SALES, "refund_rate");
    expect(SALES).toEqual(copy);
  });
});
