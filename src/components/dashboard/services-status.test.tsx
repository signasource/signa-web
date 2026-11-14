import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  failuresItem,
  ServicesStrip,
  uptimeItem,
  worstTone,
} from "@/components/dashboard/services-status";

describe("service health", () => {
  it("reads availability as a percentage with two decimals", () => {
    expect(uptimeItem("api", "API", 0.99981)).toMatchObject({ detail: "99,98%", tone: "success" });
    expect(uptimeItem("api", "API", 0.995).tone).toBe("warning");
    expect(uptimeItem("api", "API", 0.9).tone).toBe("danger");
    expect(uptimeItem("api", "API", null)).toMatchObject({ detail: "sin datos", tone: "neutral" });
  });

  it("counts failures and colours them", () => {
    expect(failuresItem("e", "Emails", 0)).toMatchObject({ detail: "0 fallos", tone: "success" });
    expect(failuresItem("e", "Emails", 1)).toMatchObject({ detail: "1 fallo", tone: "warning" });
    expect(failuresItem("e", "Emails", 25).tone).toBe("danger");
  });

  it("takes the worst tone, ignoring missing data", () => {
    expect(worstTone(["success", "neutral", "warning"])).toBe("warning");
    expect(worstTone(["neutral"])).toBe("neutral");
  });
});

describe("ServicesStrip", () => {
  afterEach(cleanup);

  it("lists every service and explains when Grafana is not configured", () => {
    const { rerender } = render(
      <ServicesStrip items={[uptimeItem("api", "API", 1), failuresItem("e", "Emails", 2)]} />,
    );
    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText("2 fallos")).toBeInTheDocument();
    rerender(<ServicesStrip items={[]} unavailable />);
    expect(screen.getByText(/falta configurar/)).toBeInTheDocument();
  });
});
