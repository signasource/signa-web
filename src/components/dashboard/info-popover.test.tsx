import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { METRICS } from "@/components/dashboard/metric-catalog";

describe("InfoPopover", () => {
  afterEach(cleanup);

  it("reveals the metric definition on click and hides it again", () => {
    render(<InfoPopover metric="error_rate" />);
    const def = METRICS.error_rate;

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Qué es/ }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(def.description);
    expect(dialog).toHaveTextContent(def.howComputed);
    expect(dialog).toHaveTextContent(def.goodWhen);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
