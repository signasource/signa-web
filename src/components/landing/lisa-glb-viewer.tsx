"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { VIEWER_MESSAGE } from "@/lib/glb";

const iframeStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
};

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
