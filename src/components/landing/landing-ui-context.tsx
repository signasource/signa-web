"use client";

import { createContext, useContext } from "react";

export type FeatureId = "signs" | "camera" | "streak";

export interface LandingUIValue {
  orgOpen: boolean;
  openOrg: () => void;
  closeOrg: () => void;
  feature: FeatureId | null;
  openFeature: (id: FeatureId) => void;
  closeFeature: () => void;
}

export const LandingUIContext = createContext<LandingUIValue | null>(null);

/** Reads the shared landing UI state (org modal, feature preview). Must be used under `LandingUIProvider`. */
export function useLandingUI(): LandingUIValue {
  const ctx = useContext(LandingUIContext);
  if (!ctx) {
    throw new Error("useLandingUI must be used within LandingUIProvider");
  }
  return ctx;
}
