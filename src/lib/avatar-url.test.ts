import { describe, expect, it } from "vitest";
import { avatarSrc } from "@/lib/avatar-url";
import { env } from "@/lib/env";

describe("avatarSrc", () => {
  it("prefixes the API origin to the path the API sends", () => {
    expect(avatarSrc("/users/ana/avatar?v=1f")).toBe(`${env.apiUrl}/users/ana/avatar?v=1f`);
  });

  it("is null when there is no photo", () => {
    expect(avatarSrc(null)).toBeNull();
    expect(avatarSrc(undefined)).toBeNull();
    expect(avatarSrc("")).toBeNull();
  });
});
