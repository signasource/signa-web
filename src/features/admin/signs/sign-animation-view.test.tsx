import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SignAnimationView } from "@/features/admin/signs/sign-animation-view";
import type { AdminSignDetail } from "@/lib/api/admin";

function sign(overrides: Partial<AdminSignDetail>): AdminSignDetail {
  return {
    id: "s1",
    meaning: "hola",
    handedness: "ONE_HANDED",
    youtubeUrl: null,
    animationUrl: "signs/hola.mp4",
    hasAnimation: true,
    animationFormat: "mp4",
    mediaUrl: "https://media.test/signs/hola.mp4",
    mediaAvailable: true,
    lateralAnimationUrl: "signs/hola-lateral.mp4",
    lateralMediaUrl: "https://media.test/signs/hola-lateral.mp4",
    animationUpdatedAt: null,
    usages: [],
    openReports: 0,
    ...overrides,
  } as AdminSignDetail;
}

describe("SignAnimationView", () => {
  afterEach(cleanup);

  it("previews the sign as in the app, with the front/lateral switch, and nothing to upload", () => {
    const { container } = render(<SignAnimationView sign={sign({})} meaning="hola" />);
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "https://media.test/signs/hola.mp4");
    fireEvent.click(screen.getByRole("tab", { name: "Lateral" }));
    expect(container.querySelector("video")).toHaveAttribute(
      "src",
      "https://media.test/signs/hola-lateral.mp4",
    );
    expect(screen.getByText("Video (.mp4)")).toBeInTheDocument();
    expect(screen.getByText(/^signs\/hola\.mp4/)).toBeInTheDocument();
    expect(screen.getByText(/^signs\/hola-lateral\.mp4/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "descargar" })[0]).toHaveAttribute(
      "href",
      "https://media.test/signs/hola.mp4",
    );
    // Read-only: no file input, no replace/upload wording.
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByText(/Reemplazar|Arrastrá|Subí/)).not.toBeInTheDocument();
  });

  it("previews a 3D avatar", () => {
    const { container } = render(
      <SignAnimationView
        sign={sign({
          animationFormat: "glb",
          animationUrl: "signs/hola.glb",
          mediaUrl: "https://media.test/signs/hola.glb",
          lateralAnimationUrl: null,
          lateralMediaUrl: null,
        })}
        meaning="hola"
      />,
    );
    expect(container.querySelector("iframe")).not.toBeNull();
    expect(screen.getByText("Avatar 3D (.glb)")).toBeInTheDocument();
    expect(screen.queryByText("Video lateral")).not.toBeInTheDocument();
  });

  it("warns when the file is missing in the bucket, without offering an upload", () => {
    render(<SignAnimationView sign={sign({ mediaAvailable: false })} meaning="hola" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falta el archivo.");
    expect(screen.getByRole("alert")).not.toHaveTextContent(/Subí/);
  });

  it("says when the sign has no animation", () => {
    render(
      <SignAnimationView
        sign={sign({
          hasAnimation: false,
          animationFormat: null,
          animationUrl: null,
          mediaUrl: null,
          lateralAnimationUrl: null,
          lateralMediaUrl: null,
        })}
        meaning="hola"
      />,
    );
    expect(screen.getByText("Todavía no tiene animación.")).toBeInTheDocument();
  });
});
