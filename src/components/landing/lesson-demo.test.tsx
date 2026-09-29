import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DEMO_QUESTIONS, LessonDemo } from "@/components/landing/lesson-demo";

describe("LessonDemo", () => {
  afterEach(cleanup);

  it("marks a wrong answer, costs a heart, and reveals the right one", () => {
    render(<LessonDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Chau" }));

    expect(screen.getByText("Era «Hola»")).toBeInTheDocument();
    expect(screen.getByLabelText("4 vidas")).toBeInTheDocument();
    // Only the picked and the correct option stay enabled.
    expect(screen.getByRole("button", { name: "Gracias" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hola" })).toBeEnabled();
  });

  it("confirms a right answer and moves the iframe to the next sign", () => {
    render(<LessonDemo />);
    const iframe = screen.getByTitle(/Lisa haciendo la seña/);
    const firstSrc = iframe.getAttribute("src");

    fireEvent.click(screen.getByRole("button", { name: "Hola" }));
    expect(screen.getByText("¡Seña correcta! +15 XP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Seguir/ }));
    const next = DEMO_QUESTIONS[1];
    for (const option of next.options) {
      expect(screen.getByRole("button", { name: option })).toBeEnabled();
    }
    // The sign is swapped in place via postMessage: the iframe is not reloaded.
    expect(screen.getByTitle(/Lisa haciendo la seña/).getAttribute("src")).toBe(firstSrc);
    expect(screen.getByLabelText("5 vidas")).toBeInTheDocument();
  });
});
