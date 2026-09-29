"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { FeatureId, useLandingUI } from "@/components/landing/landing-ui-context";

const ACCENT_BG: Record<FeatureId, string> = {
  signs: "bg-accent-violet text-on-primary",
  camera: "bg-accent-teal text-text",
  streak: "bg-accent-amber text-text",
};

const ACCENT_TEXT: Record<FeatureId, string> = {
  signs: "text-on-primary/85",
  camera: "text-text/75",
  streak: "text-text/75",
};

export function FeatureCard({
  id,
  icon,
  title,
  description,
}: {
  id: FeatureId;
  icon: string;
  title: string;
  description: string;
}) {
  const { openFeature } = useLandingUI();

  return (
    <button
      type="button"
      onClick={() => openFeature(id)}
      className={cn(
        "landing-rv landing-card-click flex flex-col items-center gap-4 rounded-[32px] p-10 text-center",
        ACCENT_BG[id],
      )}
    >
      <Image src={icon} alt="" aria-hidden width={140} height={140} className="h-[140px] w-[140px]" />
      <span className="font-display text-2xl font-bold tracking-tight">{title}</span>
      <p className={cn("text-[17px] leading-relaxed", ACCENT_TEXT[id])}>{description}</p>
    </button>
  );
}
