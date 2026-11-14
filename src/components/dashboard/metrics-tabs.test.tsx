import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MetricsTabs, type TabItem } from "@/components/dashboard/metrics-tabs";

const TABS: TabItem<"a" | "b" | "c">[] = [
  { key: "a", label: "Negocio" },
  { key: "b", label: "Aprendizaje" },
  { key: "c", label: "Infra" },
];

describe("MetricsTabs", () => {
  afterEach(cleanup);

  it("marks the active tab and notifies on click", () => {
    const onChange = vi.fn();
    render(<MetricsTabs tabs={TABS} active="a" onChange={onChange} idBase="t" />);
    expect(screen.getByRole("tab", { name: "Negocio" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Aprendizaje" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Infra" }));
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("moves selection with the arrow keys (wrapping around)", () => {
    const onChange = vi.fn();
    render(<MetricsTabs tabs={TABS} active="a" onChange={onChange} idBase="t" />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Negocio" }), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("b");
    fireEvent.keyDown(screen.getByRole("tab", { name: "Negocio" }), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("flags an apartado's health with a dot and a screen-reader label", () => {
    render(
      <MetricsTabs
        tabs={[
          { key: "a", label: "Negocio" },
          { key: "b", label: "Aprendizaje", dot: "warning" },
        ]}
        active="a"
        onChange={() => {}}
        idBase="t"
        trailing={<span>Comparando con 10 sep – 9 oct</span>}
      />,
    );
    expect(
      screen.getByRole("tab", { name: "Aprendizaje (requiere atención)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Comparando con 10 sep – 9 oct")).toBeInTheDocument();
  });
});
