import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CameraNameDemo } from "@/components/landing/camera-name-demo";

describe("CameraNameDemo", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("starts with an empty name field", () => {
    render(<CameraNameDemo />);
    expect(screen.getByPlaceholderText("Nombre")).toHaveValue("");
  });

  it("asks for a name instead of turning the camera on", () => {
    const getUserMedia = vi.fn();
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    render(<CameraNameDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Empezar a deletrear" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Escribí tu nombre para empezar.");
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("explains it when the camera permission is denied", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    render(<CameraNameDemo />);

    fireEvent.change(screen.getByPlaceholderText("Nombre"), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Empezar a deletrear" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Necesitamos permiso para usar la cámara",
    );
  });

  it("says the camera needs https outside a secure context", async () => {
    const getUserMedia = vi.fn();
    vi.stubGlobal("isSecureContext", false);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    render(<CameraNameDemo />);

    fireEvent.change(screen.getByPlaceholderText("Nombre"), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Empezar a deletrear" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La cámara solo funciona en una conexión segura (https).",
    );
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
