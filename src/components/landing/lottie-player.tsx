"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

interface LottiePlayerProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

export function LottiePlayer({ src, loop = true, autoplay = true, className }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("lottie-web").then((mod) => {
      if (cancelled || !containerRef.current) return;
      animRef.current = mod.default.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay,
        path: src,
      });
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [src, loop, autoplay]);

  return <div ref={containerRef} className={className} />;
}
