import { describe, expect, it } from "vitest";
import {
  daysLeft,
  emailsFromSheet,
  formatMoney,
  purchaseFormSchema,
  seatEmailSchema,
  uniqueEmails,
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
