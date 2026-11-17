export const MARKETING_PATHS = [
  "/",
  "/privacidad",
  "/terminos",
  "/proximamente",
  "/organizations",
  "/eliminar-cuenta",
] as const;

const isDev = process.env.NODE_ENV === "development";
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

export function buildViewerCsp(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    // apiUrl: the sign editor previews uploads served by the API's local media fallback (dev).
    `connect-src 'self' blob: ${apiUrl} https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev https://cdn.jsdelivr.net https://www.gstatic.com`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
  ].join("; ");
}

export function buildCsp(nonce?: string): string {
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "'self' 'unsafe-inline' 'wasm-unsafe-eval'";
  const demoModels = nonce ? "" : " https://storage.googleapis.com";
  const styleSrc = nonce && !isDev ? `'self' 'nonce-${nonce}'` : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src ${styleSrc} https://accounts.google.com/gsi/style`,
    `img-src 'self' data: blob: ${apiUrl} https://*.googleusercontent.com`,
    // 'self': the sign preview embeds our own GLB viewer route in an iframe.
    "frame-src 'self' https://accounts.google.com/gsi/",
    "font-src 'self'",
    `connect-src 'self' blob: ${apiUrl} https://accounts.google.com/gsi/ https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev${demoModels}`,
    `media-src 'self' ${apiUrl} https://*.r2.cloudflarestorage.com https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
