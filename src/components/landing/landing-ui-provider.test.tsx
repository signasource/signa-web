import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LandingUIProvider } from "@/components/landing/landing-ui-provider";
import { OrgTrigger } from "@/components/landing/org-trigger";
import { FeatureCard } from "@/components/landing/feature-card";

describe("LandingUIProvider", () => {
  it("renders OrgTrigger as a link to the organizations page", () => {
    render(
      <LandingUIProvider>
        <OrgTrigger>Soy una organización</OrgTrigger>
      </LandingUIProvider>,
    );

    const link = screen.getByRole("link", { name: "Soy una organización" });
    expect(link).toHaveAttribute("href", "/organizaciones");
  });

  it("opens a feature preview for the clicked card", async () => {
    render(
      <LandingUIProvider>
        <FeatureCard
          id="camera"
          icon="/icons/camara.svg"
          title="Tu cámara te corrige"
          description="…"
        />
      </LandingUIProvider>,
    );

    fireEvent.click(screen.getByText("Tu cámara te corrige"));
    expect(screen.getByText("TU CÁMARA TE CORRIGE")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.getByRole("dialog")).toHaveClass("landing-modal-out");
    await waitFor(() => expect(screen.queryByText("TU CÁMARA TE CORRIGE")).not.toBeInTheDocument());
  });
});
