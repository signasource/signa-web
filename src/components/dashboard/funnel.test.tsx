import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { biggestDrop, Funnel, funnelPath, funnelTransitions } from "@/components/dashboard/funnel";

const STEPS = [
  { key: "Registrados", count: 9870 },
  { key: "Iniciaron una lección", count: 6120 },
  { key: "Hicieron un ejercicio", count: 5480 },
  { key: "Completaron una lección", count: 3910 },
  { key: "Completaron 2 o más", count: 2240 },
];

describe("funnel math", () => {
  it("computes the share that continues to each next step", () => {
    expect(funnelTransitions(STEPS)).toEqual([62, 90, 71, 57]);
  });

  it("finds the transition with the biggest drop", () => {
    expect(biggestDrop([62, 90, 71, 57])).toBe(3);
    expect(biggestDrop([null, 100])).toBe(-1);
  });

  it("drops a step that fewer people reach than a later one", () => {
    const steps = [
      { key: "Registrados", count: 197 },
      { key: "Iniciaron una lección", count: 150 },
      { key: "Hicieron un ejercicio", count: 128 },
      { key: "Completaron una lección", count: 138 },
      { key: "Completaron 2+", count: 109 },
    ];
    expect(funnelPath(steps).map((s) => s.key)).toEqual([
      "Registrados",
      "Iniciaron una lección",
      "Completaron una lección",
      "Completaron 2+",
    ]);
    expect(funnelPath(STEPS)).toEqual(STEPS);
  });
});

describe("Funnel", () => {
  afterEach(cleanup);

  it("labels every transition and calls out the biggest drop", () => {
    render(<Funnel title="Embudo de aprendizaje" metric="learning_funnel" steps={STEPS} />);
    expect(screen.getByText("↓ 62% sigue")).toBeInTheDocument();
    expect(screen.getByText("↓ 57% sigue · mayor caída")).toBeInTheDocument();
    expect(screen.getByText("9.870")).toBeInTheDocument();
  });

  it("explains an empty funnel", () => {
    render(<Funnel title="Embudo" metric="learning_funnel" steps={[]} />);
    expect(screen.getByText("Sin datos todavía.")).toBeInTheDocument();
  });
});
