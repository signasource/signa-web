import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidEmail, subscribeToWaitlist } from "@/lib/waitlist";

describe("waitlist", () => {
  const fetchMock = vi.fn<typeof fetch>();
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("validates emails before calling the API", async () => {
    expect(isValidEmail("ana@mail.com")).toBe(true);
    expect(isValidEmail("ana@mail")).toBe(false);
    vi.stubGlobal("fetch", fetchMock);
    expect(await subscribeToWaitlist("no-es-un-email")).toMatchObject({ ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the normalized email", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }));
    expect(await subscribeToWaitlist("  Ana@Mail.com ")).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0]![1]!.body).toBe(JSON.stringify({ email: "ana@mail.com" }));
  });

  it("never shows a server or connection failure to the visitor", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    expect(await subscribeToWaitlist("ana@mail.com")).toEqual({ ok: true });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
    expect(await subscribeToWaitlist("ana@mail.com")).toEqual({ ok: true });
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(await subscribeToWaitlist("ana@mail.com")).toEqual({ ok: true });
  });
});
