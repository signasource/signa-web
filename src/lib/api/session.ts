import { ApiError } from "@/lib/api/client";
import { tokenStore } from "@/lib/api/token-store";

async function post(path: string, body?: unknown): Promise<Response> {
  return fetch(path, {
    method: "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function startSession(path: string, body: unknown): Promise<void> {
  const res = await post(path, body);
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    message?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new ApiError(res.status, data.message ?? `Request failed (${res.status})`);
  }
  tokenStore.set(data.access_token);
}

export const sessionApi = {
  login: (identifier: string, password: string): Promise<void> =>
    startSession("/api/session/login", { identifier, password }),

  register: (account: {
    email: string;
    username: string;
    password: string;
    name: string;
    lastName: string;
  }): Promise<void> => startSession("/api/session/register", account),

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
