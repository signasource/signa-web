"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FeatureId,
  LandingUIContext,
  LandingUIValue,
} from "@/components/landing/landing-ui-context";
import { FeaturePreview } from "@/components/landing/feature-preview";

const CLOSE_MS = 280;

export function LandingUIProvider({ children }: { children: React.ReactNode }) {
  const [feature, setFeature] = useState<FeatureId | null>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const openFeature = useCallback((id: FeatureId) => {
    window.clearTimeout(closeTimer.current);
    setClosing(false);
    setFeature(id);
  }, []);

  const closeFeature = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setClosing(true);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    closeTimer.current = window.setTimeout(
      () => {
        setFeature(null);
        setClosing(false);
      },
      reduced ? 0 : CLOSE_MS,
    );
  }, []);

  const value = useMemo<LandingUIValue>(
    () => ({ feature, openFeature, closeFeature }),
    [feature, openFeature, closeFeature],
  );

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", block, { passive: false });
    document.addEventListener("gesturechange", block, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", block);
      document.removeEventListener("gesturechange", block);
    };
  }, []);

  useEffect(() => {
    if (!feature) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      closeFeature();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [feature, closeFeature]);

  return (
    <LandingUIContext.Provider value={value}>
      {children}
      {feature && <FeaturePreview feature={feature} closing={closing} />}
    </LandingUIContext.Provider>
  );
}
