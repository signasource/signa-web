import { describe, expect, it } from "vitest";
import {
  invitationLoginSchema,
  invitationRegisterSchema,
  usernameFromEmail,
} from "@/lib/invitation-account";

describe("usernameFromEmail", () => {
  it("keeps the allowed characters of the local part and adds a suffix", () => {
    expect(usernameFromEmail("José.Pérez+rrhh@empresa.com", () => 0.0421)).toBe(
      "Jose_Perez_rrhh_0421",
    );
  });

  it("pads short or empty local parts so the API accepts them", () => {
    expect(usernameFromEmail("a@x.com", () => 0)).toBe("a_user_0000");
    expect(usernameFromEmail("@x.com", () => 0.5)).toBe("signa_5000");
  });

  it("never exceeds the API limit of 50 characters", () => {
    expect(usernameFromEmail(`${"x".repeat(80)}@x.com`).length).toBeLessThanOrEqual(50);
  });
});

describe("invitationRegisterSchema", () => {
  const valid = {
    name: "Ana",
    lastName: "Gómez",
    password: "12345678",
    confirmPassword: "12345678",
  };

  it("accepts a valid account", () => {
    expect(invitationRegisterSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = invitationRegisterSchema.safeParse({ ...valid, confirmPassword: "x" });
    expect(result.success ? null : result.error.issues[0]?.message).toBe(
      "Las contraseñas no coinciden.",
    );
  });

  it("rejects short passwords and names with digits", () => {
    expect(
      invitationRegisterSchema.safeParse({ ...valid, password: "1", confirmPassword: "1" }).success,
    ).toBe(false);
    expect(invitationRegisterSchema.safeParse({ ...valid, name: "Ana2" }).success).toBe(false);
  });
});

describe("invitationLoginSchema", () => {
  it("requires a password", () => {
    expect(invitationLoginSchema.safeParse({ password: "" }).success).toBe(false);
  });
});
