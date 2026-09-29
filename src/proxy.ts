import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, MARKETING_PATHS } from "@/lib/security/csp";

// Strict per-request nonce CSP for every route except the static marketing pages, which get their
// (relaxed) CSP from next.config.ts. Fail-safe: a new public page not listed in MARKETING_PATHS
// gets the strict policy and must render dynamically — it breaks loudly instead of running unprotected.
export function proxy(request: NextRequest) {
  if ((MARKETING_PATHS as readonly string[]).includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
