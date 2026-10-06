import { keysToCamel, keysToSnake } from "@/lib/case";
import { env } from "@/lib/env";
import { tokenStore } from "@/lib/api/token-store";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  anonymous?: boolean;
};

let onSessionExpired: (() => void) | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function setOnSessionExpired(cb: (() => void) | null) {
  onSessionExpired = cb;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${env.apiUrl}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.getAccess();
  if (!options.anonymous && token) headers.Authorization = `Bearer ${token}`;

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(keysToSnake(options.body)),
  });
}

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const { sessionApi } = await import("@/lib/api/session");
      return await sessionApi.refresh();
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function toError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  try {
    const data = (await res.json()) as { message?: string };
    if (data.message) message = data.message;
  } catch {}
  return new ApiError(res.status, message);
}

export async function api<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options);

  if (res.status === 401 && !options.anonymous) {
    if (await refreshSession()) {
      res = await send(path, options);
    } else {
      tokenStore.clear();
      onSessionExpired?.();
    }
  }

  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? keysToCamel<T>(JSON.parse(text)) : undefined) as T;
}
