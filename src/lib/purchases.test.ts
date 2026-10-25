import { describe, expect, it } from "vitest";
import {
  daysLeft,
  emailsFromSheet,
  formatMoney,
  nextVolumeDiscount,
  paymentMessage,
  paymentReturn,
  purchaseFormSchema,
  seatEmailSchema,
  uniqueEmails,
  volumeDiscountFor,
} from "@/lib/purchases";

const schema = purchaseFormSchema({ minDays: 15, maxDays: 60, maxSeats: 3 });

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
    expect(message({ durationDays: 14 })).toBe("El mínimo es 15 días.");
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

  it("falls back to the first column and keeps a header-less first row", () => {
    expect(emailsFromSheet([["ana@x.com"], ["bruno@x.com"]])).toEqual(["ana@x.com", "bruno@x.com"]);
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
  it("reads our result and Mercado Pago's payment id", () => {
    expect(
      paymentReturn(new URLSearchParams("pago=aprobado&payment_id=123&status=approved")),
    ).toEqual({ result: "aprobado", paymentId: "123" });
    expect(paymentReturn(new URLSearchParams("pago=pendiente&collection_id=55"))).toEqual({
      result: "pendiente",
      paymentId: "55",
    });
  });

  it("ignores a missing or non-numeric payment id", () => {
    expect(paymentReturn(new URLSearchParams("pago=rechazado&payment_id=null"))).toEqual({
      result: "rechazado",
      paymentId: null,
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
});
