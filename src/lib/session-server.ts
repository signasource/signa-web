import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export const REFRESH_COOKIE = "signa_refresh";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/session",
};

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    if (host) return originHost === host;
    return new URL(origin).origin === new URL(env.siteUrl).origin;
  } catch {
    return false;
  }
}

export const deny = () => NextResponse.json({ message: "Forbidden" }, { status: 403 });

export function clearSession(response: NextResponse): NextResponse {
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

type TokenPair = { accessToken: string; refreshToken: string };
type ExchangeResult =
  { ok: true; tokens: TokenPair } | { ok: false; status: number; message: string };

async function requestTokens(path: string, body: Record<string, string>): Promise<ExchangeResult> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 502, message: "No pudimos conectarnos." };
  }
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    message?: string;
  };
  if (!res.ok || !data.access_token || !data.refresh_token) {
    const status = res.ok ? 502 : res.status;
    return { ok: false, status, message: data.message ?? `Request failed (${status})` };
  }
  return { ok: true, tokens: { accessToken: data.access_token, refreshToken: data.refresh_token } };
}

function toResponse(result: ExchangeResult): NextResponse {
  if (!result.ok) {
    const response = NextResponse.json({ message: result.message }, { status: result.status });
    // Keep the cookie on 5xx / network errors: the session is probably fine, the API is not.
    return result.status < 500 ? clearSession(response) : response;
  }
  const response = NextResponse.json(
    { access_token: result.tokens.accessToken },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(REFRESH_COOKIE, result.tokens.refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}

export async function exchange(path: string, body: Record<string, string>): Promise<NextResponse> {
  return toResponse(await requestTokens(path, body));
}

// Refresh tokens rotate: a second refresh with the same (already used) token is rejected by the
// API, which used to log the user out when two tabs, a remount or HMR refreshed at once. Requests
// carrying the same token within the grace window share one upstream call and its result.
const REFRESH_GRACE_MS = 30_000;
const recentRefreshes = new Map<string, { result: Promise<ExchangeResult>; expires: number }>();

export function refreshOnce(refreshToken: string): NextResponse | Promise<NextResponse> {
  const now = Date.now();
  for (const [key, entry] of recentRefreshes) {
    if (entry.expires <= now) recentRefreshes.delete(key);
  }
  let entry = recentRefreshes.get(refreshToken);
  if (!entry) {
    entry = {
      result: requestTokens("/auth/refresh", { refresh_token: refreshToken }),
      expires: now + REFRESH_GRACE_MS,
    };
    recentRefreshes.set(refreshToken, entry);
  }
  return entry.result.then((result) => {
    // Don't replay failures: let the next request retry upstream.
    if (!result.ok) recentRefreshes.delete(refreshToken);
    return toResponse(result);
  });
}

export const refreshTokenOf = (request: NextRequest) => request.cookies.get(REFRESH_COOKIE)?.value;
