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
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const deny = () => NextResponse.json({ message: "Forbidden" }, { status: 403 });

export function clearSession(response: NextResponse): NextResponse {
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function exchange(path: string, body: Record<string, string>): Promise<NextResponse> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "No pudimos conectarnos." }, { status: 502 });
  }
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    message?: string;
  };
  if (!res.ok || !data.access_token || !data.refresh_token) {
    const status = res.ok ? 502 : res.status;
    return clearSession(
      NextResponse.json({ message: data.message ?? `Request failed (${status})` }, { status }),
    );
  }
  const response = NextResponse.json(
    { access_token: data.access_token },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(REFRESH_COOKIE, data.refresh_token, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}

export const refreshTokenOf = (request: NextRequest) => request.cookies.get(REFRESH_COOKIE)?.value;
