"use client";

import { cn } from "@/lib/utils";
import { useLandingUI } from "@/components/landing/landing-ui-context";

/** Opens the "Signa para organizaciones" modal. Used from the nav, hero, footer, and final CTA. */
export function OrgTrigger({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { openOrg } = useLandingUI();
  return (
    <button type="button" onClick={openOrg} className={cn("cursor-pointer", className)}>
      {children}
    </button>
  );
}
