import type { NextConfig } from "next";
import { buildCsp, MARKETING_PATHS } from "./src/lib/security/csp";

// Headers for every route. The strict nonce CSP for non-marketing routes is added by src/proxy.ts.
// Docs: docs/security.md
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Static marketing pages: relaxed CSP (no nonce possible on prerendered HTML).
      ...MARKETING_PATHS.map((source) => ({
        source,
        headers: [{ key: "Content-Security-Policy", value: buildCsp() }],
      })),
      // The glb-viewer route handler must be embeddable by same-origin iframes.
      // This more-specific rule overrides the global X-Frame-Options: DENY above.
      {
        source: "/api/glb-viewer",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

export default nextConfig;
