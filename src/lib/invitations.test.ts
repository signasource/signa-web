import { describe, expect, it } from "vitest";
import { inviteEmailsSchema } from "@/lib/invitations";

const message = (emails: string) => {
  const result = inviteEmailsSchema.safeParse({ emails });
  return result.success ? null : result.error.issues[0]?.message;
};

describe("inviteEmailsSchema", () => {
  it("requires at least one email", () => {
    expect(message("  ,\n ")).toBe("Ingresá al menos un email.");
  });

  it("names the first invalid email", () => {
    expect(message("a@x.com, nope")).toBe("«nope» no parece un email válido.");
  });

  it("accepts comma and newline separated emails", () => {
    expect(message("a@x.com,\nb@x.com")).toBeNull();
  });
});
