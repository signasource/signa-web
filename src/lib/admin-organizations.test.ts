import { describe, expect, it } from "vitest";
import { matchesOrganization } from "@/lib/admin-organizations";
import type { AdminOrganization } from "@/lib/api/admin";

const org = {
  id: "o1",
  name: "Clínica Demo",
  status: "ACTIVE",
  cuit: "30-71234567-8",
  contactEmail: "rrhh@clinica.com",
  contactPhone: null,
  createdAt: "2026-11-01T12:00:00Z",
  activeMembers: 4,
  adminName: "Paula Benítez",
  adminEmail: "paula@clinica.com",
  suspensionReason: null,
} as AdminOrganization;

describe("matchesOrganization", () => {
  it("matches name, emails and admin ignoring case and accents", () => {
    expect(matchesOrganization(org, "clinica")).toBe(true);
    expect(matchesOrganization(org, "RRHH@")).toBe(true);
    expect(matchesOrganization(org, "benitez")).toBe(true);
    expect(matchesOrganization(org, "hospital")).toBe(false);
  });

  it("matches the CUIT by its digits, with or without dashes", () => {
    expect(matchesOrganization(org, "71234567")).toBe(true);
    expect(matchesOrganization(org, "30-7123")).toBe(true);
    expect(matchesOrganization(org, "99")).toBe(false);
  });

  it("matches everything with an empty search", () => {
    expect(matchesOrganization(org, "  ")).toBe(true);
  });
});
