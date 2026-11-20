import { describe, expect, it } from "vitest";
import {
  fmtBytes,
  fmtLatency,
  fmtMoney,
  fmtMoneyCompact,
  fmtPercent,
  fmtPercentRatio,
  fmtReqs,
  fmtReqsShort,
} from "@/components/dashboard/perf-format";

describe("perf formatters", () => {
  it("formats latency in ms under a second and in s above", () => {
    expect(fmtLatency(0.025)).toBe("25 ms");
    expect(fmtLatency(1.5)).toBe("1,50 s");
  });

  it("formats a ratio as a percentage and an already-percentage as-is", () => {
    expect(fmtPercentRatio(0.053)).toBe("5,3%");
    expect(fmtPercent(85)).toBe("85%");
  });

  it("formats requests per second", () => {
    expect(fmtReqs(12.345)).toBe("12,35/s");
  });

  it("formats headline request rates", () => {
    expect(fmtReqsShort(38.4)).toBe("38 req/s");
    expect(fmtReqsShort(0.42)).toBe("0,4 req/s");
  });

  it("scales bytes to a human unit", () => {
    expect(fmtBytes(512)).toBe("512,0 B");
    expect(fmtBytes(1024)).toBe("1,0 KB");
    expect(fmtBytes(5 * 1024 * 1024)).toBe("5,0 MB");
  });

  it("formats pesos with no decimals", () => {
    expect(fmtMoney(12000)).toContain("12.000");
  });
});

describe("fmtMoneyCompact", () => {
  it("keeps a decimal under $100 k so side-by-side amounts add up", () => {
    expect(fmtMoneyCompact(20_500)).toBe("$20,5 k");
    expect(fmtMoneyCompact(5_500)).toBe("$5,5 k");
    expect(fmtMoneyCompact(26_000)).toBe("$26 k");
    expect(fmtMoneyCompact(2_500)).toBe("$2,5 k");
  });

  it("rounds to whole thousands from $100 k and to two decimals in millions", () => {
    expect(fmtMoneyCompact(181_400)).toBe("$181 k");
    expect(fmtMoneyCompact(13_770_000)).toBe("$13,77 M");
  });
});
