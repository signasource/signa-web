"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FeatureId,
  LandingUIContext,
  LandingUIValue,
} from "@/components/landing/landing-ui-context";
import { FeaturePreview } from "@/components/landing/feature-preview";

export function LandingUIProvider({ children }: { children: React.ReactNode }) {
  const [feature, setFeature] = useState<FeatureId | null>(null);

  const value = useMemo<LandingUIValue>(
    () => ({
      feature,
      openFeature: (id) => setFeature(id),
      closeFeature: () => setFeature(null),
    }),
    [feature],
  );

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
      setFeature(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [feature]);

  return (
    <LandingUIContext.Provider value={value}>
      {children}
      {feature && <FeaturePreview feature={feature} />}
    </LandingUIContext.Provider>
  );
}
