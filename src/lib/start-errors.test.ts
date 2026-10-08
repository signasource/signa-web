import { describe, expect, it } from "vitest";
import { cameraMessage, engineMessage, inAppBrowser } from "@/lib/start-errors";

const INSTAGRAM =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0";
const CHROME =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

describe("start errors", () => {
  it("recognizes in-app browsers", () => {
    expect(inAppBrowser(INSTAGRAM)).toBe("Instagram");
    expect(inAppBrowser("Mozilla/5.0 ... [FBAN/FBIOS;FBAV/400.0]")).toBe("Facebook");
    expect(inAppBrowser(CHROME)).toBeNull();
  });

  it("tells Instagram users to open the page in a real browser", () => {
    const denied = new DOMException("denied", "NotAllowedError");
    expect(cameraMessage(denied, INSTAGRAM)).toContain("navegador de Instagram");
    expect(cameraMessage(denied, CHROME)).toContain("permiso");
  });

  it("names the camera problem", () => {
    expect(cameraMessage(new DOMException("x", "NotFoundError"), CHROME)).toContain(
      "ninguna cámara",
    );
    expect(cameraMessage(new DOMException("x", "NotReadableError"), CHROME)).toContain("Otra app");
  });

  it("blames the connection, not the browser, when a download fails", () => {
    expect(engineMessage(new TypeError("Failed to fetch"), CHROME, true)).toContain("conexión");
    expect(engineMessage(new Error("HTTP 503"), CHROME, true)).toContain("conexión");
    expect(engineMessage(new Error("algo"), CHROME, false)).toContain("conexión");
    expect(engineMessage(new Error("algo"), CHROME, true)).toContain("Chrome, Edge");
  });
});
