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

  it("sends the normalized email and reports the real result", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }));
    expect(await subscribeToWaitlist("  Ana@Mail.com ")).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0]![1]!.body).toBe(JSON.stringify({ email: "ana@mail.com" }));

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
    expect(await subscribeToWaitlist("ana@mail.com")).toMatchObject({ ok: false });
  });
});
