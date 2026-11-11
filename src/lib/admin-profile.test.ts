import { describe, expect, it } from "vitest";
import {
  adminInitials,
  adminProfileSchema,
  buildAdminUpdate,
  createAdminSchema,
  fitWithin,
  type AdminProfileValues,
} from "@/lib/admin-profile";

const original = { name: "Ana", lastName: "Pérez", email: "ana@signa.com" };
const same: AdminProfileValues = {
  name: "Ana",
  lastName: "Pérez",
  email: "ana@signa.com",
  password: "",
  confirmPassword: "",
};
const withPassword = { ...same, password: "claveNueva1", confirmPassword: "claveNueva1" };

describe("adminProfileSchema", () => {
  it("accepts an untouched profile with no new password", () => {
    expect(adminProfileSchema.safeParse(same).success).toBe(true);
  });

  it("rejects an invalid email and empty names", () => {
    const r = adminProfileSchema.safeParse({ ...same, name: " ", email: "nope" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const fields = r.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("name");
      expect(fields).toContain("email");
    }
  });

  it("requires 8–72 characters when changing the password", () => {
    const short = { ...same, password: "corta", confirmPassword: "corta" };
    const long = { ...same, password: "x".repeat(73), confirmPassword: "x".repeat(73) };
    expect(adminProfileSchema.safeParse(short).success).toBe(false);
    expect(adminProfileSchema.safeParse(long).success).toBe(false);
    expect(adminProfileSchema.safeParse(withPassword).success).toBe(true);
  });

  it("requires the confirmation to match", () => {
    const r = adminProfileSchema.safeParse({ ...withPassword, confirmPassword: "otra" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});

describe("buildAdminUpdate", () => {
  it("returns null when nothing changed", () => {
    expect(buildAdminUpdate(original, same, undefined)).toBeNull();
  });

  it("sends only the changed fields", () => {
    expect(buildAdminUpdate(original, { ...same, name: " Anita " }, undefined)).toEqual({
      name: "Anita",
    });
  });

  it("ignores an email that only differs in case", () => {
    expect(buildAdminUpdate(original, { ...same, email: "ANA@signa.com" }, undefined)).toBeNull();
  });

  it("sends the password only when one was typed", () => {
    expect(buildAdminUpdate(original, withPassword, undefined)).toEqual({
      password: "claveNueva1",
    });
  });

  it("replaces the photo with a data URL and removes it with an empty string", () => {
    expect(buildAdminUpdate(original, same, "data:image/jpeg;base64,AAAA")).toEqual({
      avatar: "data:image/jpeg;base64,AAAA",
    });
    expect(buildAdminUpdate(original, same, null)).toEqual({ avatar: "" });
  });
});

describe("fitWithin", () => {
  it("shrinks the longest side to the max keeping the ratio", () => {
    expect(fitWithin(1024, 512, 256)).toEqual({ width: 256, height: 128 });
    expect(fitWithin(300, 600, 256)).toEqual({ width: 128, height: 256 });
  });

  it("never upscales", () => {
    expect(fitWithin(100, 50, 256)).toEqual({ width: 100, height: 50 });
  });
});

describe("adminInitials", () => {
  it("uses both initials, uppercased", () => {
    expect(adminInitials("ana", "pérez")).toBe("AP");
  });

  it("falls back to ? with no names", () => {
    expect(adminInitials("", " ")).toBe("?");
  });
});

describe("createAdminSchema", () => {
  const valid = { name: "Ana", lastName: "Pérez", email: "ana@signa.com", password: "claveNueva1" };

  it("accepts a complete admin", () => {
    expect(createAdminSchema.safeParse(valid).success).toBe(true);
  });

  it("requires every field and a valid email", () => {
    const r = createAdminSchema.safeParse({ name: "", lastName: "", email: "x", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const fields = r.error.issues.map((i) => i.path[0]);
      expect(fields).toEqual(expect.arrayContaining(["name", "lastName", "email", "password"]));
    }
  });

  it("requires a password of 8–72 characters", () => {
    expect(createAdminSchema.safeParse({ ...valid, password: "corta" }).success).toBe(false);
    expect(createAdminSchema.safeParse({ ...valid, password: "x".repeat(73) }).success).toBe(false);
  });
});
