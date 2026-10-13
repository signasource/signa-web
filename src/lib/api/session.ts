import { ApiError } from "@/lib/api/client";
import { tokenStore } from "@/lib/api/token-store";

async function post(path: string, body?: unknown): Promise<Response> {
  return fetch(path, {
    method: "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const sessionApi = {
  async login(identifier: string, password: string): Promise<void> {
    const res = await post("/api/session/login", { identifier, password });
    const data = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      message?: string;
    };
    if (!res.ok || !data.access_token) {
      throw new ApiError(res.status, data.message ?? `Request failed (${res.status})`);
    }
    tokenStore.set(data.access_token);
  },

  async refresh(): Promise<boolean> {
    try {
      const res = await post("/api/session/refresh");
      if (!res.ok) return false;
      const data = (await res.json()) as { access_token?: string };
      if (!data.access_token) return false;
      tokenStore.set(data.access_token);
      return true;
    } catch {
      return false;
    }
  },

  logout(): void {
    tokenStore.clear();
    void post("/api/session/logout").catch(() => {});
  },
};
