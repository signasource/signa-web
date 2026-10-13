import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api/client";
import { tokenStore } from "@/lib/api/token-store";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    tokenStore.set("old");
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    tokenStore.clear();
  });

  it("sends the Bearer token and converts casing both ways", async () => {
    fetchMock.mockResolvedValueOnce(json({ some_value: 1 }));

    const result = await api<{ someValue: number }>("/x", {
      method: "POST",
      body: { camelKey: 1 },
    });

    const [, init] = fetchMock.mock.calls[0]!;
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer old");
    expect(init!.body).toBe(JSON.stringify({ camel_key: 1 }));
    expect(result).toEqual({ someValue: 1 });
  });

  it("refreshes once on 401 and retries the original request", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ message: "expired" }, 401))
      .mockResolvedValueOnce(json({ access_token: "new" }))
      .mockResolvedValueOnce(json({ ok: true }));

    await expect(api<{ ok: boolean }>("/x")).resolves.toEqual({ ok: true });
    expect(tokenStore.getAccess()).toBe("new");
    expect(fetchMock.mock.calls[1]![0]).toBe("/api/session/refresh");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws ApiError with the API message on failure", async () => {
    fetchMock.mockResolvedValueOnce(json({ message: "Nope" }, 403));

    await expect(api("/x")).rejects.toMatchObject({
      constructor: ApiError,
      status: 403,
      message: "Nope",
    });
  });
});
