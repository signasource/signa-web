import type { NextConfig } from "next";
import { buildCsp, MARKETING_PATHS } from "./src/lib/security/csp";

const DISABLED_FEATURES = [
  "accelerometer",
  "browsing-topics",
  "display-capture",
  "encrypted-media",
  "geolocation",
  "gyroscope",
  "hid",
  "idle-detection",
  "magnetometer",
  "microphone",
  "midi",
  "payment",
  "picture-in-picture",
  "publickey-credentials-get",
  "screen-wake-lock",
  "serial",
  "usb",
  "xr-spatial-tracking",
];

function permissionsPolicy(camera: "self" | "none"): string {
  return [
    `camera=${camera === "self" ? "(self)" : "()"}`,
    "fullscreen=(self)",
    ...DISABLED_FEATURES.map((f) => `${f}=()`),
  ].join(", ");
}

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy("none") },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...MARKETING_PATHS.map((source) => ({
        source,
        headers: [{ key: "Content-Security-Policy", value: buildCsp() }],
      })),
      { source: "/", headers: [{ key: "Permissions-Policy", value: permissionsPolicy("self") }] },
      { source: "/api/glb-viewer", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] },
    ];
  },
};

export default nextConfig;
