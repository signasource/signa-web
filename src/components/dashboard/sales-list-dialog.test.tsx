import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SalesListDialog } from "@/components/dashboard/sales-list-dialog";
import type { Sale } from "@/lib/api/metrics";

function sale(overrides: Partial<Sale>): Sale {
  return {
    id: "s",
    type: "SEATS",
    productName: "LSA Salud",
    productDetail: "3 cupos × 30 días",
    buyerName: "Hospital Central",
    courseId: "c1",
    amount: 30000,
    currency: "ARS",
    paidAt: "2026-11-15T12:00:00Z",
    refunded: false,
    refundedAt: null,
    refundReason: null,
    ...overrides,
  };
}

const SALES = [
  sale({ id: "a" }),
  sale({
    id: "b",
    type: "GEMS",
    courseId: null,
    productName: "Bolsa de gemas",
    productDetail: "500 gemas",
    buyerName: "Ana Pérez",
    amount: 5000,
    refunded: true,
    refundedAt: "2026-11-17T12:00:00Z",
    refundReason: "UNSPECIFIED",
  }),
  sale({
    id: "c",
    type: "COURSE",
    buyerName: "Juan Gómez",
    amount: 9000,
    refunded: true,
    refundedAt: "2026-11-18T12:00:00Z",
    refundReason: "CHARGEBACK",
  }),
];

describe("SalesListDialog", () => {
  afterEach(cleanup);

  it("lists only the refunded purchases behind the refund rate, with their reason", () => {
    render(<SalesListDialog view="refund_rate" sales={SALES} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "Compras reembolsadas" });
    expect(
      within(dialog).getByText("De 3 compras pagadas en el período, se reembolsaron 2 (66,7%)"),
    ).toBeInTheDocument();
    const rows = within(dialog).getAllByRole("row");
    // header, 2 refunded purchases, total
    expect(rows).toHaveLength(4);
    expect(rows[1]).toHaveTextContent("Ana Pérez");
    expect(rows[1]).toHaveTextContent("Sin motivo registrado");
    expect(rows[2]).toHaveTextContent("Contracargo");
    expect(within(dialog).queryByText("Hospital Central")).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Solo reembolsadas")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Total (2)").closest("tr")).toHaveTextContent("$ 14.000");
  });

  it("links every row to the purchase in the Compras page", () => {
    render(<SalesListDialog view="income" sales={SALES} onClose={() => {}} />);
    expect(
      screen.getByRole("link", { name: "Ver la compra de Hospital Central: LSA Salud" }),
    ).toHaveAttribute("href", "/admin/purchases?purchase=a&type=SEATS");
  });

  it("agrees in number with a single purchase", () => {
    render(<SalesListDialog view="refund_rate" sales={[SALES[1]!]} onClose={() => {}} />);
    expect(
      screen.getByText("De 1 compra pagada en el período, se reembolsó 1 (100,0%)"),
    ).toBeInTheDocument();
  });

  it("says when there is nothing to list", () => {
    render(<SalesListDialog view="income" sales={[]} onClose={() => {}} />);
    expect(
      screen.getByText("0 compras pagadas en el período y no reembolsadas · $ 0"),
    ).toBeInTheDocument();
    expect(screen.getByText("No hay compras para mostrar en este período.")).toBeInTheDocument();
  });

  it("closes with the ✕, Escape and the backdrop, not when clicking inside", () => {
    const onClose = vi.fn();
    render(<SalesListDialog view="income" sales={SALES} onClose={onClose} />);
    const close = screen.getByRole("button", { name: "Cerrar" });
    expect(close).toHaveFocus();
    expect(close).not.toHaveTextContent("Cerrar");
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear();

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
