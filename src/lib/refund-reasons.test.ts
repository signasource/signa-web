import { describe, expect, it } from "vitest";
import {
  REFUND_REASON_OPTIONS,
  REFUND_REASON_VALUES,
  refundReasonLabel,
} from "@/lib/refund-reasons";

describe("refund reasons", () => {
  it("offers the six buyer reasons shared with the API and the app", () => {
    expect(REFUND_REASON_VALUES).toEqual([
      "MISTAKE",
      "DUPLICATE",
      "NOT_RECEIVED",
      "NOT_AS_EXPECTED",
      "TECHNICAL",
      "OTHER",
    ]);
    expect(REFUND_REASON_OPTIONS.every((o) => o.label.length > 0)).toBe(true);
  });

  it("labels every reason a refund can carry in the back-office", () => {
    expect(refundReasonLabel("MISTAKE")).toBe("Compré por error");
    expect(refundReasonLabel("CHARGEBACK")).toBe("Contracargo");
    expect(refundReasonLabel("UNSPECIFIED")).toBe("Sin motivo registrado");
    expect(refundReasonLabel(null)).toBe("Sin motivo");
    expect(refundReasonLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});
