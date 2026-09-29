"use client";

import { useMemo, useState } from "react";
import {
  FeatureId,
  LandingUIContext,
  LandingUIValue,
} from "@/components/landing/landing-ui-context";
import { OrganizationsModal } from "@/components/landing/organizations-modal";
import { FeaturePreview } from "@/components/landing/feature-preview";

/**
 * Only client boundary the landing page needs: holds the org-modal and feature-preview state and
 * renders the two overlays. Everything else (`children`) is server-rendered and passed straight
 * through — see docs/features/landing.md.
 */
export function LandingUIProvider({ children }: { children: React.ReactNode }) {
  const [orgOpen, setOrgOpen] = useState(false);
  const [feature, setFeature] = useState<FeatureId | null>(null);

  const value = useMemo<LandingUIValue>(
    () => ({
      orgOpen,
      openOrg: () => setOrgOpen(true),
      closeOrg: () => setOrgOpen(false),
      feature,
      openFeature: (id) => setFeature(id),
      closeFeature: () => setFeature(null),
    }),
    [orgOpen, feature],
  );

  return (
    <LandingUIContext.Provider value={value}>
      {children}
      {orgOpen && <OrganizationsModal />}
      {feature && <FeaturePreview feature={feature} />}
    </LandingUIContext.Provider>
  );
}
