import { describe, expect, it } from "vitest";
import { METRICS, toneFor, type MetricThreshold } from "@/components/dashboard/metric-catalog";

const DOWN: MetricThreshold = { dir: "down", warn: 70, danger: 85 };
const UP: MetricThreshold = { dir: "up", warn: 40, danger: 20 };

describe("toneFor", () => {
  it("returns neutral without a value or without a threshold", () => {
    expect(toneFor(null, DOWN)).toBe("neutral");
    expect(toneFor(undefined, DOWN)).toBe("neutral");
    expect(toneFor(50)).toBe("neutral");
  });

  it("colours a lower-is-better metric by its crossing points", () => {
    expect(toneFor(50, DOWN)).toBe("success");
    expect(toneFor(70, DOWN)).toBe("warning");
    expect(toneFor(84, DOWN)).toBe("warning");
    expect(toneFor(85, DOWN)).toBe("danger");
    expect(toneFor(99, DOWN)).toBe("danger");
  });

  it("colours a higher-is-better metric by its crossing points", () => {
    expect(toneFor(60, UP)).toBe("success");
    expect(toneFor(40, UP)).toBe("warning");
    expect(toneFor(21, UP)).toBe("warning");
    expect(toneFor(20, UP)).toBe("danger");
    expect(toneFor(0, UP)).toBe("danger");
  });
});

describe("METRICS catalog", () => {
  it("gives every entry the self-documenting fields", () => {
    for (const [id, def] of Object.entries(METRICS)) {
      expect(def.label, id).toBeTruthy();
      expect(def.description, id).toBeTruthy();
      expect(def.howComputed, id).toBeTruthy();
      expect(def.goodWhen, id).toBeTruthy();
    }
  });
});
