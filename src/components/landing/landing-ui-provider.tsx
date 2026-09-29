"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FeatureId,
  LandingUIContext,
  LandingUIValue,
} from "@/components/landing/landing-ui-context";
import { OrganizationsModal } from "@/components/landing/organizations-modal";
import { FeaturePreview } from "@/components/landing/feature-preview";

export function LandingUIProvider({ children }: { children: React.ReactNode }) {
  const [orgOpen, setOrgOpen] = useState(false);
  const [feature, setFeature] = useState<FeatureId | null>(null);
  const overlayOpen = orgOpen || feature !== null;

  const value = useMemo<LandingUIValue>(
    () => ({
      orgOpen,
      openOrg: () => {
        setFeature(null);
        setOrgOpen(true);
      },
      closeOrg: () => setOrgOpen(false),
      feature,
      openFeature: (id) => setFeature(id),
      closeFeature: () => setFeature(null),
    }),
    [orgOpen, feature],
  );

  useEffect(() => {
    if (!overlayOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setFeature(null);
      setOrgOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [overlayOpen]);

  return (
    <LandingUIContext.Provider value={value}>
      {children}
      {orgOpen && <OrganizationsModal />}
      {feature && <FeaturePreview feature={feature} />}
    </LandingUIContext.Provider>
  );
}
