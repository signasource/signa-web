import { NextResponse, type NextRequest } from "next/server";
import { clearSession, deny, exchange, refreshTokenOf, sameOrigin } from "@/lib/session-server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return deny();
  const refreshToken = refreshTokenOf(request);
  if (!refreshToken) {
    return clearSession(NextResponse.json({ message: "Sin sesión" }, { status: 401 }));
  }
  return exchange("/auth/refresh", { refresh_token: refreshToken });
}
