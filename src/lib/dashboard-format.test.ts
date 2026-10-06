import { describe, expect, it } from "vitest";
import {
  daysSince,
  formatDate,
  formatMinutes,
  formatRelativeDays,
  initials,
  isEmail,
  memberDisplayStatus,
  parseEmails,
  progressTone,
} from "@/lib/dashboard-format";

const NOW = new Date(2026, 9, 2, 15, 0);

describe("dashboard formatters", () => {
  it("formats dates and relative days", () => {
    expect(formatDate("2026-09-01")).toBe("1 sep 2026");
    expect(formatRelativeDays(null)).toBe("Nunca");
    expect(formatRelativeDays(0)).toBe("Hoy");
    expect(formatRelativeDays(1)).toBe("Ayer");
    expect(formatRelativeDays(9)).toBe("Hace 9 días");
  });

  it("counts calendar days", () => {
    expect(daysSince(null, NOW)).toBeNull();
    expect(daysSince(new Date(2026, 9, 2, 1, 0).toISOString(), NOW)).toBe(0);
    expect(daysSince(new Date(2026, 9, 1, 23, 0).toISOString(), NOW)).toBe(1);
  });

  it("formats minutes", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(120)).toBe("2 h");
    expect(formatMinutes(135)).toBe("2 h 15 min");
  });

  it("picks progress tones", () => {
    expect(progressTone(100)).toBe("success");
    expect(progressTone(10)).toBe("warning");
    expect(progressTone(60)).toBe("primary");
  });

  it("builds initials", () => {
    expect(initials("carla", "Romero")).toBe("CR");
  });

  it("derives the display status", () => {
    const recent = new Date().toISOString();
    const old = new Date(Date.now() - 20 * 86_400_000).toISOString();
    const base = { status: "ACTIVE" as const, progressPercentage: 50, lastActivityAt: recent };
    expect(memberDisplayStatus(base)).toBe("active");
    expect(memberDisplayStatus({ ...base, lastActivityAt: old })).toBe("inactive");
    expect(memberDisplayStatus({ ...base, progressPercentage: 100 })).toBe("completed");
    expect(memberDisplayStatus({ ...base, progressPercentage: 0, lastActivityAt: null })).toBe(
      "notStarted",
    );
    expect(memberDisplayStatus({ ...base, status: "REMOVED" })).toBe("removed");
  });

  it("parses and validates emails", () => {
    expect(parseEmails("a@x.com, b@x.com\n c@x.com;")).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
    expect(isEmail("a@x.com")).toBe(true);
    expect(isEmail("nope")).toBe(false);
  });
});
