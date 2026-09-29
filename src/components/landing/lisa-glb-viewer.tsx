import type { CSSProperties } from "react";

// The GLB animation is served from a dedicated Route Handler (/api/glb-viewer) so the iframe
// has a real same-origin URL context — equivalent to signa-mobile's WebView baseUrl pattern.
// The route handler owns the model-viewer HTML, CSP, and X-Frame-Options for this resource.

const iframeStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
};

export function LisaGlbViewer({ sign }: { sign: string }) {
  const src = `/api/glb-viewer?sign=${encodeURIComponent(sign)}`;
  return <iframe src={src} title="Lisa mostrando la seña en 3D" style={iframeStyle} />;
}
