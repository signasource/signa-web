"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { VIEWER_LOADED, VIEWER_MESSAGE, VIEWER_PRELOAD } from "@/lib/glb";

const iframeStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
};

/**
 * Lisa signing in 3D (the /api/glb-viewer iframe).
 *
 * `preload` loads those signs ahead of time inside the viewer, so switching to them later is
 * instant: loading a model blocks the page's main thread for a moment (the iframe is same-origin),
 * which is better paid up front than in the middle of an exercise. `onLoaded` reports each sign
 * once it is ready (or failed to load).
 */
export function LisaGlbViewer({
  sign,
  preload,
  onLoaded,
}: {
  sign: string;
  preload?: readonly string[];
  onLoaded?: (sign: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => `/api/glb-viewer?sign=${encodeURIComponent(sign)}`);
  const shown = useRef(sign);
  const [frameReady, setFrameReady] = useState(false);
  const preloadKey = preload?.join("\n") ?? "";

  useEffect(() => {
    if (shown.current === sign) return;
    shown.current = sign;
    frame.current?.contentWindow?.postMessage(
      { type: VIEWER_MESSAGE, sign },
      window.location.origin,
    );
  }, [sign]);

  useEffect(() => {
    if (!frameReady || !preloadKey) return;
    frame.current?.contentWindow?.postMessage(
      { type: VIEWER_PRELOAD, signs: preloadKey.split("\n") },
      window.location.origin,
    );
  }, [frameReady, preloadKey]);

  useEffect(() => {
    if (!onLoaded) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const data = e.data as { type?: unknown; sign?: unknown } | null;
      if (data?.type === VIEWER_LOADED && typeof data.sign === "string") onLoaded(data.sign);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onLoaded]);

  return (
    <iframe
      ref={frame}
      src={src}
      title="Lisa haciendo la seña en 3D. Arrastrá para girarla."
      style={iframeStyle}
      onLoad={() => setFrameReady(true)}
    />
  );
}
