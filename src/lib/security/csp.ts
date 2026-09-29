// Content Security Policy builder. Canonical reference: docs/security.md
//
// Two tiers:
//  - Public static pages (MARKETING_PATHS): no tokens, no user input → static CSP with 'unsafe-inline'
//    scripts so they stay prerendered and CDN-cacheable.
//  - Everything else (login, dashboard, …): strict nonce-based CSP set per request by src/proxy.ts.
//    These routes must render dynamically (`await connection()` in their layout).

/** Exact paths served statically with the relaxed CSP. Anything not listed gets the strict nonce CSP. */
export const MARKETING_PATHS = ["/", "/privacidad", "/terminos"] as const;

const isDev = process.env.NODE_ENV === "development";
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

/** `nonce` present → strict policy; absent → relaxed policy for static marketing pages. */
export function buildCsp(nonce?: string): string {
  const scriptSrc = nonce ? `'self' 'nonce-${nonce}' 'strict-dynamic'` : "'self' 'unsafe-inline'";
  const styleSrc = nonce && !isDev ? `'self' 'nonce-${nonce}'` : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src ${styleSrc}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${apiUrl}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
