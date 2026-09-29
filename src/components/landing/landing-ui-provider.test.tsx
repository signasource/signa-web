import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LandingUIProvider } from "@/components/landing/landing-ui-provider";
import { OrgTrigger } from "@/components/landing/org-trigger";
import { FeatureCard } from "@/components/landing/feature-card";

describe("LandingUIProvider", () => {
  it("opens and closes the organizations modal", () => {
    render(
      <LandingUIProvider>
        <OrgTrigger>Soy una organización</OrgTrigger>
      </LandingUIProvider>,
    );

    expect(screen.queryByRole("dialog", { name: "Signa para organizaciones" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Soy una organización"));
    expect(screen.getByRole("dialog", { name: "Signa para organizaciones" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog", { name: "Signa para organizaciones" })).not.toBeInTheDocument();
  });

  it("opens a feature preview for the clicked card, independently of the org modal", () => {
    render(
      <LandingUIProvider>
        <FeatureCard id="camera" icon="/icons/camara.svg" title="Tu cámara te corrige" description="…" />
      </LandingUIProvider>,
    );

    fireEvent.click(screen.getByText("Tu cámara te corrige"));
    expect(screen.getByText("TU CÁMARA TE CORRIGE")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Signa para organizaciones" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByText("TU CÁMARA TE CORRIGE")).not.toBeInTheDocument();
  });
});
