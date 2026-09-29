"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { VIEWER_MESSAGE } from "@/lib/glb";

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

/**
 * Lisa signing `sign` in 3D (drag to rotate). Changing `sign` after mount swaps the model inside
 * the already-loaded iframe via postMessage instead of reloading it.
 */
export function LisaGlbViewer({ sign }: { sign: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => `/api/glb-viewer?sign=${encodeURIComponent(sign)}`);
  const shown = useRef(sign);

  useEffect(() => {
    if (shown.current === sign) return;
    shown.current = sign;
    frame.current?.contentWindow?.postMessage(
      { type: VIEWER_MESSAGE, sign },
      window.location.origin,
    );
  }, [sign]);

  return (
    <iframe
      ref={frame}
      src={src}
      title="Lisa haciendo la seña en 3D. Arrastrá para girarla."
      style={iframeStyle}
    />
  );
}
