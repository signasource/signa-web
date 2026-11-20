import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@/lib/api/auth";
import { mapAuthError } from "@/lib/auth-errors";
import { ApiError } from "@/lib/api/client";

describe("authApi password reset", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("forgotPassword posts the email anonymously", async () => {
    await authApi.forgotPassword("a@b.com");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/auth/forgot-password");
    expect(init!.body).toBe(JSON.stringify({ email: "a@b.com" }));
    expect((init!.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("resetPassword posts email, code and new password in the body", async () => {
    await authApi.resetPassword("a@b.com", "123456", "nueva-clave");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/auth/reset-password");
    expect(String(url)).not.toContain("token=");
    expect(init!.body).toBe(
      JSON.stringify({ email: "a@b.com", code: "123456", new_password: "nueva-clave" }),
    );
  });
});

describe("mapAuthError password reset", () => {
  it("translates the invalid code error", () => {
    expect(mapAuthError(new ApiError(400, "Invalid or expired code"), "x")).toBe(
      "El código no es válido o venció. Pedí uno nuevo.",
    );
  });
});
