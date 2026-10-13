import { describe, expect, it } from "vitest";
import {
  currentModuleLabel,
  daysSince,
  formatDate,
  formatMinutes,
  formatRelativeDays,
  initials,
  isEmail,
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

  it("labels the current module", () => {
    const base = {
      activityStatus: "ACTIVE" as const,
      currentModule: "Unidad 2",
      currentCourse: "Curso Básico",
    };
    expect(currentModuleLabel(base, false)).toEqual({
      text: "Unidad 2",
      detail: null,
      finished: false,
    });
    expect(currentModuleLabel(base, true).detail).toBe("Curso Básico");
    expect(currentModuleLabel({ ...base, activityStatus: "COMPLETED" }, false)).toEqual({
      text: "Terminó el curso",
      detail: null,
      finished: true,
    });
    expect(currentModuleLabel({ ...base, activityStatus: "COMPLETED" }, true).text).toBe(
      "Terminó todo",
    );
    expect(
      currentModuleLabel({ ...base, activityStatus: "NOT_STARTED", currentModule: null }, false)
        .text,
    ).toBe("Todavía no empezó");
    expect(
      currentModuleLabel({ ...base, activityStatus: "INACTIVE", currentModule: null }, false).text,
    ).toBe("—");
  });

  it("parses and validates emails", () => {
    expect(parseEmails("a@x.com, b@x.com\n c@x.com;")).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
    expect(isEmail("a@x.com")).toBe(true);
    expect(isEmail("nope")).toBe(false);
  });
});
