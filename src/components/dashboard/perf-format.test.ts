import { describe, expect, it } from "vitest";
import {
  fmtBytes,
  fmtLatency,
  fmtMoney,
  fmtPercent,
  fmtPercentRatio,
  fmtReqs,
} from "@/components/dashboard/perf-format";

describe("perf formatters", () => {
  it("formats latency in ms under a second and in s above", () => {
    expect(fmtLatency(0.025)).toBe("25 ms");
    expect(fmtLatency(1.5)).toBe("1.50 s");
  });

  it("formats a ratio as a percentage and an already-percentage as-is", () => {
    expect(fmtPercentRatio(0.053)).toBe("5.3%");
    expect(fmtPercent(85)).toBe("85%");
  });

  it("formats requests per second", () => {
    expect(fmtReqs(12.345)).toBe("12.35/s");
  });

  it("scales bytes to a human unit", () => {
    expect(fmtBytes(512)).toBe("512.0 B");
    expect(fmtBytes(1024)).toBe("1.0 KB");
    expect(fmtBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("formats pesos with no decimals", () => {
    expect(fmtMoney(12000)).toContain("12.000");
  });
});
