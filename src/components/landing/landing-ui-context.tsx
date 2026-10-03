"use client";

import { createContext, useContext } from "react";

export type FeatureId = "signs" | "camera" | "streak" | "social";

export interface LandingUIValue {
  feature: FeatureId | null;
  openFeature: (id: FeatureId) => void;
  closeFeature: () => void;
}

export const LandingUIContext = createContext<LandingUIValue | null>(null);

export function useLandingUI(): LandingUIValue {
  const ctx = useContext(LandingUIContext);
  if (!ctx) {
    throw new Error("useLandingUI must be used within LandingUIProvider");
  }
  return ctx;
}
