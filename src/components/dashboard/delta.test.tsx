import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { computeDelta, DeltaPill } from "@/components/dashboard/delta";

describe("computeDelta", () => {
  it("is not comparable without a previous value", () => {
    expect(computeDelta(10, null)).toEqual({
      direction: "flat",
      tone: "neutral",
      change: null,
      label: "",
    });
  });

  it("formats a relative change with an Argentine comma", () => {
    const d = computeDelta(1182, 1000);
    expect(d).toMatchObject({ direction: "up", tone: "good", change: 18.2, label: "18,2%" });
  });

  it("colours a drop as bad when up is good", () => {
    expect(computeDelta(3412, 3521)).toMatchObject({ direction: "down", tone: "bad" });
  });

  it("colours a drop as good when down is good (refunds, latency)", () => {
    expect(computeDelta(4.3, 4.9, { mode: "pp", good: "down" })).toMatchObject({
      direction: "down",
      tone: "good",
      label: "0,6 pp",
    });
  });

  it("keeps the requested decimals for percentage points", () => {
    expect(computeDelta(61.2, 63.2, { mode: "pp" }).label).toBe("2,0 pp");
    expect(computeDelta(68, 64, { mode: "pp", decimals: 0 }).label).toBe("4 pp");
  });

  it("formats an absolute difference with the given formatter", () => {
    const d = computeDelta(0.182, 0.194, {
      mode: "abs",
      good: "down",
      format: (v) => `${Math.round(v * 1000)} ms`,
    });
    expect(d).toMatchObject({ direction: "down", tone: "good", label: "12 ms" });
  });

  it("reads a start from zero as new instead of an infinite change", () => {
    expect(computeDelta(5, 0)).toMatchObject({ direction: "new", label: "nuevo" });
    expect(computeDelta(0, 0)).toMatchObject({ direction: "flat", label: "0,0%" });
  });

  it("stays neutral for a metric without a good direction", () => {
    expect(computeDelta(38, 35, { good: "neutral" }).tone).toBe("neutral");
  });
});

describe("DeltaPill", () => {
  afterEach(cleanup);

  it("renders the arrow and label, and nothing when not comparable", () => {
    const { container, rerender } = render(<DeltaPill current={110} previous={100} />);
    expect(container).toHaveTextContent("▲10,0%");
    expect(screen.getByText(/vs. período anterior/)).toBeInTheDocument();
    rerender(<DeltaPill current={110} previous={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
