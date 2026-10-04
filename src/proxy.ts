import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, MARKETING_PATHS } from "@/lib/security/csp";

const PASSTHROUGH_PATHS: readonly string[] = [
  ...(MARKETING_PATHS as readonly string[]),
  "/api/glb-viewer",
];

export function proxy(request: NextRequest) {
  if (PASSTHROUGH_PATHS.includes(request.nextUrl.pathname)) {
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
