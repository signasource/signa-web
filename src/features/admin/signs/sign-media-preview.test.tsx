import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SignMediaPreview } from "@/features/admin/signs/sign-media-preview";

describe("SignMediaPreview", () => {
  afterEach(cleanup);

  it("plays an mp4 as a looping muted video", () => {
    render(<SignMediaPreview meaning="hola" format="mp4" url="https://cdn/lsa/hola.mp4?v=1" />);

    const video = screen.getByLabelText("Video de frente de la seña hola") as HTMLVideoElement;
    expect(video.tagName).toBe("VIDEO");
    expect(video.src).toBe("https://cdn/lsa/hola.mp4?v=1");
    expect(video.loop).toBe(true);
    expect(video.muted).toBe(true);
  });

  it("loads a glb in the URL viewer", () => {
    render(<SignMediaPreview meaning="hola" format="glb" url="https://cdn/lsa/hola.glb" />);

    const frame = screen.getByTitle("Animación 3D de la seña hola");
    expect(frame.getAttribute("src")).toBe(
      "/api/glb-viewer/file?src=https%3A%2F%2Fcdn%2Flsa%2Fhola.glb",
    );
  });

  it("shows an empty state without animation", () => {
    render(<SignMediaPreview meaning="hola" format={null} url={null} />);

    expect(screen.getByText("Sin animación")).toBeTruthy();
    expect(screen.getByText("hola")).toBeTruthy();
  });

  it("switches between the front and lateral videos", () => {
    render(
      <SignMediaPreview
        meaning="hola"
        format="mp4"
        url="https://cdn/lsa/hola.mp4"
        lateralUrl="https://cdn/lsa/hola_lateral.mp4"
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Lateral" }));

    const video = screen.getByLabelText("Video lateral de la seña hola") as HTMLVideoElement;
    expect(video.src).toBe("https://cdn/lsa/hola_lateral.mp4");
  });

  it("has no view switch without a lateral video, and warns when the file is missing", () => {
    render(<SignMediaPreview meaning="ayer" format="glb" url="https://cdn/lsa/ayer.glb" missing />);

    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByText("Falta el archivo")).toBeTruthy();
    expect(screen.queryByTitle("Animación 3D de la seña ayer")).toBeNull();
  });
});
