import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { Purchase } from "@/lib/api/types";
import {
  seatsInGroup,
  visiblePurchases,
  daysToComplete,
  refundResolveErrorMessage,
  signsWithin,
  acceptedSeats,
  canWithdraw,
  daysLeft,
  emailsFromSheet,
  formatMoney,
  isErasedEmail,
  nextVolumeDiscount,
  paymentMessage,
  paymentReturn,
  purchaseFormSchema,
  seatEmailLabel,
  seatEmailSchema,
  seatStatusLabel,
  uniqueEmails,
  withdrawalSchema,
  volumeDiscountFor,
} from "@/lib/purchases";

const schema = purchaseFormSchema({ minDays: 5, maxDays: 60, maxSeats: 3 });

const message = (values: Partial<{ courseId: string; durationDays: number; emails: string }>) => {
  const result = schema.safeParse({
    courseId: "c",
    durationDays: 30,
    emails: "a@x.com",
    ...values,
  });
  return result.success ? null : result.error.issues[0]?.message;
};

describe("purchaseFormSchema", () => {
  it("accepts a valid purchase", () => {
    expect(message({})).toBeNull();
  });

  it("requires a course", () => {
    expect(message({ courseId: "" })).toBe("Elegí un curso.");
  });

  it("keeps the duration inside the range", () => {
    expect(message({ durationDays: 4 })).toBe("El mínimo es 5 días.");
    expect(message({ durationDays: 61 })).toBe("El máximo es 60 días.");
    expect(message({ durationDays: 20.5 })).toBe("Ingresá un número entero de días.");
  });

  it("requires at least one email", () => {
    expect(message({ emails: " ,\n" })).toBe("Ingresá al menos un email.");
  });

  it("names the first invalid email", () => {
    expect(message({ emails: "a@x.com, nope" })).toBe("«nope» no parece un email válido.");
  });

  it("rejects repeated emails ignoring case", () => {
    expect(message({ emails: "a@x.com\nA@x.com" })).toBe(
      "«A@x.com» está repetido: cada cupo necesita un email distinto.",
    );
  });

  it("limits the seats per purchase", () => {
    expect(message({ emails: "a@x.com b@x.com c@x.com d@x.com" })).toBe(
      "Podés comprar hasta 3 cupos por vez.",
    );
  });
});

describe("seatEmailSchema", () => {
  it("validates a single email", () => {
    expect(seatEmailSchema.safeParse({ email: " a@x.com " }).success).toBe(true);
    expect(seatEmailSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("uniqueEmails", () => {
  it("lower-cases and drops duplicates", () => {
    expect(uniqueEmails("A@x.com, a@x.com; b@x.com")).toEqual(["a@x.com", "b@x.com"]);
  });
});

describe("emailsFromSheet", () => {
  it("reads the column whose header mentions mail", () => {
    expect(
      emailsFromSheet([
        ["Nombre", "Correo electrónico"],
        ["Ana", "ana@x.com"],
        ["Bruno", "no-es-mail"],
      ]),
    ).toEqual(["ana@x.com"]);
  });

  it("keeps a header-less first row", () => {
    expect(emailsFromSheet([["ana@x.com"], ["bruno@x.com"]])).toEqual(["ana@x.com", "bruno@x.com"]);
  });

  it("finds emails regardless of leading empty rows or columns", () => {
    expect(emailsFromSheet([[], [undefined, "marina@x.com"], ["", "mabel@x.com"]])).toEqual([
      "marina@x.com",
      "mabel@x.com",
    ]);
  });

  it("returns nothing for an empty sheet", () => {
    expect(emailsFromSheet([])).toEqual([]);
  });
});

describe("daysLeft", () => {
  const now = new Date("2026-10-25T12:00:00Z");

  it("rounds up the days until the deadline", () => {
    expect(daysLeft("2026-10-27T11:00:00Z", now)).toBe(2);
  });

  it("never counts from before the payment", () => {
    // The page read the clock 2 s before the payment was confirmed: still a 10-day window.
    const paidAt = "2026-10-25T12:00:02Z";
    expect(daysLeft("2026-11-04T12:00:02Z", now, paidAt)).toBe(10);
    expect(daysLeft("2026-11-04T12:00:02Z", now)).toBe(11);
    expect(daysLeft("2026-11-04T12:00:02Z", new Date("2026-10-30T12:00:00Z"), paidAt)).toBe(6);
  });

  it("is zero once the deadline passed and null without one", () => {
    expect(daysLeft("2026-10-20T00:00:00Z", now)).toBe(0);
    expect(daysLeft(null, now)).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats pesos without decimals", () => {
    expect(formatMoney(45000, "ARS").replace(/\s/g, " ")).toBe("$ 45.000");
  });
});

const tiers = [
  { minSeats: 25, percent: 15 },
  { minSeats: 10, percent: 10 },
];

describe("volumeDiscountFor", () => {
  it("returns the best tier reached", () => {
    expect(volumeDiscountFor(9, tiers)).toBe(0);
    expect(volumeDiscountFor(10, tiers)).toBe(10);
    expect(volumeDiscountFor(30, tiers)).toBe(15);
    expect(volumeDiscountFor(30, [])).toBe(0);
  });
});

describe("nextVolumeDiscount", () => {
  it("says how many more seats reach the next tier", () => {
    expect(nextVolumeDiscount(7, tiers)).toEqual({ missing: 3, percent: 10 });
    expect(nextVolumeDiscount(10, tiers)).toEqual({ missing: 15, percent: 15 });
  });

  it("returns null past the last tier", () => {
    expect(nextVolumeDiscount(25, tiers)).toBeNull();
    expect(nextVolumeDiscount(3, [])).toBeNull();
  });
});

describe("paymentReturn", () => {
  it("reads our result and ignores Mercado Pago's own params", () => {
    expect(
      paymentReturn(new URLSearchParams("pago=aprobado&order_id=ORD1&status=approved")),
    ).toEqual({ result: "aprobado" });
    expect(paymentReturn(new URLSearchParams("pago=rechazado&payment_id=null"))).toEqual({
      result: "rechazado",
    });
  });

  it("returns null when the page was not opened from Mercado Pago", () => {
    expect(paymentReturn(new URLSearchParams(""))).toBeNull();
    expect(paymentReturn(new URLSearchParams("pago=otro&payment_id=1"))).toBeNull();
  });
});

describe("paymentMessage", () => {
  it("maps Mercado Pago statuses to a tone", () => {
    expect(paymentMessage("approved").tone).toBe("success");
    expect(paymentMessage("rejected").tone).toBe("danger");
    expect(paymentMessage("cancelled").tone).toBe("danger");
    expect(paymentMessage("in_process").tone).toBe("warning");
    expect(paymentMessage("pending").tone).toBe("warning");
  });

  it("reads the order statuses Mercado Pago uses with Orders", () => {
    expect(paymentMessage("failed").tone).toBe("danger");
    expect(paymentMessage("canceled").tone).toBe("danger");
    expect(paymentMessage("expired").tone).toBe("danger");
    expect(paymentMessage("action_required").tone).toBe("warning");
    expect(paymentMessage("processing").tone).toBe("warning");
  });
});

describe("seatStatusLabel", () => {
  it("reads seats ended by a refund differently", () => {
    expect(seatStatusLabel("REVOKED", "REFUNDED")).toBe("Acceso anulado");
    expect(seatStatusLabel("CANCELLED", "REFUNDED")).toBe("Invitación anulada");
    expect(seatStatusLabel("REVOKED", "PAID")).toBe("Quitado");
    expect(seatStatusLabel("ACCESS_EXPIRED", "REFUNDED")).toBe("Acceso vencido");
  });
});

describe("canWithdraw", () => {
  const now = new Date("2026-10-25T12:00:00Z");
  const purchase = (
    status: Purchase["status"],
    refundableUntil: string | null,
    hasAcceptedSeats = false,
  ) => ({ status, refundableUntil, hasAcceptedSeats }) as Purchase;

  it("is open only for a paid purchase before the deadline", () => {
    expect(canWithdraw(purchase("PAID", "2026-10-26T00:00:00Z"), now)).toBe(true);
    expect(canWithdraw(purchase("PAID", "2026-10-25T12:00:00Z"), now)).toBe(false);
    expect(canWithdraw(purchase("PAID", null), now)).toBe(false);
    expect(canWithdraw(purchase("REFUNDED", "2026-10-26T00:00:00Z"), now)).toBe(false);
  });

  it("closes as soon as an invitee accepted, even inside the period", () => {
    expect(canWithdraw(purchase("PAID", "2026-10-26T00:00:00Z", true), now)).toBe(false);
  });

  it("is open for a purchase SIGNA confirmed by hand, until its refund was asked for", () => {
    const manual = {
      ...purchase("PAID", "2026-10-26T00:00:00Z"),
      paymentMethod: "MANUAL",
    } as Purchase;
    expect(canWithdraw(manual, now)).toBe(true);
    expect(canWithdraw({ ...manual, hasRefundRequest: true }, now)).toBe(false);
  });
});

describe("withdrawalSchema", () => {
  it("requires a reason from the shared list and keeps the comment optional", () => {
    expect(withdrawalSchema.safeParse({ reason: "MISTAKE", message: "" }).success).toBe(true);
    expect(withdrawalSchema.safeParse({ reason: "", message: "x" }).error?.issues[0]?.message).toBe(
      "Elegí un motivo.",
    );
    expect(withdrawalSchema.safeParse({ message: "x" }).success).toBe(false);
    expect(withdrawalSchema.safeParse({ reason: "CHARGEBACK", message: "" }).success).toBe(false);
  });

  it("caps the comment at 500 characters", () => {
    expect(withdrawalSchema.safeParse({ reason: "OTHER", message: "x".repeat(500) }).success).toBe(
      true,
    );
    expect(
      withdrawalSchema.safeParse({ reason: "OTHER", message: "x".repeat(501) }).error?.issues[0]
        ?.message,
    ).toBe("Usá hasta 500 caracteres.");
  });
});

describe("acceptedSeats", () => {
  it("counts everyone who accepted, including revoked accesses", () => {
    expect(
      acceptedSeats({
        pendingPayment: 0,
        invited: 2,
        invitationExpired: 1,
        active: 3,
        accessExpired: 1,
        revoked: 2,
      }),
    ).toBe(6);
  });
});

describe("seatEmailLabel", () => {
  it("shows friendly copy for an anonymized (erased) account", () => {
    const email = "erased-3f2a9c1e-0000-4b6a-9d11-aaaaaaaaaaaa@invalid";
    expect(isErasedEmail(email)).toBe(true);
    expect(seatEmailLabel(email)).toBe("Cuenta eliminada");
  });

  it("keeps real emails untouched", () => {
    expect(isErasedEmail("ana@empresa.com")).toBe(false);
    expect(seatEmailLabel("ana@empresa.com")).toBe("ana@empresa.com");
  });
});

describe("daysToComplete", () => {
  it("rounds up the days at 15 minutes a day and 6 minutes per sign", () => {
    expect(daysToComplete(30)).toBe(12);
    expect(daysToComplete(31)).toBe(13);
    expect(daysToComplete(1)).toBe(1);
  });
  it("is 0 for an empty course or no daily time", () => {
    expect(daysToComplete(0)).toBe(0);
    expect(daysToComplete(10, 0)).toBe(0);
  });
  it("takes another pace", () => {
    expect(daysToComplete(30, 30, 5)).toBe(5);
  });
});

describe("signsWithin", () => {
  it("counts the signs reached in the days, capped at the course", () => {
    expect(signsWithin(60, 200)).toBe(150);
    expect(signsWithin(60, 40)).toBe(40);
    expect(signsWithin(0, 40)).toBe(0);
  });
});

describe("refundResolveErrorMessage", () => {
  it("explains a refund refused because a seat was accepted", () => {
    expect(
      refundResolveErrorMessage(
        new ApiError(
          400,
          "This purchase cannot be refunded: an invitee already accepted their seat",
        ),
      ),
    ).toBe("No se puede reembolsar: al menos un invitado ya aceptó su cupo.");
  });

  it("falls back to a generic message", () => {
    expect(refundResolveErrorMessage(new ApiError(500, "boom"))).toBe(
      "No pudimos guardar los cambios. Probá de nuevo.",
    );
  });
});

describe("visiblePurchases", () => {
  const bought = (id: string, status: Purchase["status"], createdAt: string) =>
    ({ id, status, createdAt }) as Purchase;
  const LIST = [
    bought("a", "PAID", "2026-11-10T15:00:00Z"),
    bought("b", "REFUNDED", "2026-11-01T02:00:00Z"), // Oct 31 at 23:00 in Argentina
    bought("c", "PENDING_PAYMENT", "2026-11-20T12:00:00Z"),
    bought("d", "CANCELLED", "2026-11-05T12:00:00Z"),
  ];
  const ids = (list: Purchase[]) => list.map((p) => p.id);

  it("sorts by purchase date both ways", () => {
    expect(ids(visiblePurchases(LIST, { status: "ALL", period: null, direction: "desc" }))).toEqual(
      ["c", "a", "d", "b"],
    );
    expect(ids(visiblePurchases(LIST, { status: "ALL", period: null, direction: "asc" }))).toEqual([
      "b",
      "d",
      "a",
      "c",
    ]);
  });

  it("filters by payment state", () => {
    const by = (status: Purchase["status"]) =>
      ids(visiblePurchases(LIST, { status, period: null, direction: "desc" }));
    expect(by("PAID")).toEqual(["a"]);
    expect(by("REFUNDED")).toEqual(["b"]);
    expect(by("PENDING_PAYMENT")).toEqual(["c"]);
  });

  it("filters by the Argentine day of the purchase, both ends included", () => {
    const november = { from: "2026-11-01", to: "2026-11-10" };
    expect(
      ids(visiblePurchases(LIST, { status: "ALL", period: november, direction: "desc" })),
    ).toEqual(["a", "d"]);
    expect(
      ids(
        visiblePurchases(LIST, {
          status: "ALL",
          period: { from: "2026-10-31", to: "2026-10-31" },
          direction: "desc",
        }),
      ),
    ).toEqual(["b"]);
  });

  it("does not reorder the list it was given", () => {
    const copy = [...LIST];
    visiblePurchases(LIST, { status: "ALL", period: null, direction: "asc" });
    expect(LIST).toEqual(copy);
  });
});

describe("seatsInGroup", () => {
  const seats = [
    { id: "active", activatedAt: "2026-11-01T00:00:00Z" },
    { id: "expired", activatedAt: "2026-10-01T00:00:00Z" },
    { id: "invited", activatedAt: null },
    { id: "lost", activatedAt: null },
  ];
  it("splits who accepted the invitation from who did not", () => {
    expect(seatsInGroup(seats, "ALL")).toHaveLength(4);
    expect(seatsInGroup(seats, "ACCEPTED").map((s) => s.id)).toEqual(["active", "expired"]);
    expect(seatsInGroup(seats, "NOT_ACCEPTED").map((s) => s.id)).toEqual(["invited", "lost"]);
  });
});
