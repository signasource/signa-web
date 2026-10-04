"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { VIEWER_MESSAGE, VIEWER_PRELOAD } from "@/lib/glb";

const iframeStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
};

const viewerUrl = (sign: string) => `/api/glb-viewer?sign=${encodeURIComponent(sign)}`;

export function LisaGlbViewer({
  sign,
  preload,
  delay = 0,
}: {
  sign: string;
  preload?: readonly string[];
  delay?: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const shown = useRef(sign);
  const [src, setSrc] = useState<string | null>(() => (delay ? null : viewerUrl(sign)));
  const [frameReady, setFrameReady] = useState(false);
  const preloadKey = preload?.join("\n") ?? "";

  useEffect(() => {
    if (!delay) return;
    const timer = window.setTimeout(() => setSrc(viewerUrl(shown.current)), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

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

  if (!src) return null;

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
