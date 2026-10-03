"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { FeatureId, useLandingUI } from "@/components/landing/landing-ui-context";

const ACCENT_BG: Record<FeatureId, string> = {
  signs: "bg-accent-violet text-on-primary",
  camera: "bg-accent-teal text-text",
  streak: "bg-accent-amber text-text",
  social: "bg-avatar-wine-light text-social-wine",
};

const ACCENT_TEXT: Record<FeatureId, string> = {
  signs: "text-on-primary/85",
  camera: "text-text/75",
  streak: "text-text/75",
  social: "text-social-wine/75",
};

export function FeatureCard({
  id,
  icon,
  title,
  description,
  delayMs = 0,
}: {
  id: FeatureId;
  icon: string;
  title: string;
  description?: string;
  delayMs?: number;
}) {
  const { openFeature } = useLandingUI();

  return (
    <div data-reveal="up" style={{ "--delay": `${delayMs}ms` } as CSSProperties}>
      <button
        type="button"
        onClick={() => openFeature(id)}
        className={cn(
          "landing-card-click group flex h-full w-full cursor-pointer flex-col items-center gap-4 rounded-[32px] p-8 text-center sm:p-10",
          ACCENT_BG[id],
        )}
      >
        <Image
          src={icon}
          alt=""
          aria-hidden
          width={140}
          height={140}
          className="h-[120px] w-[120px] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 sm:h-[140px] sm:w-[140px]"
        />
        <span className="font-display text-2xl font-bold tracking-tight">{title}</span>
        {description && (
          <p className={cn("text-[17px] leading-relaxed", ACCENT_TEXT[id])}>{description}</p>
        )}
        <span className="mt-auto flex items-center gap-1.5 rounded-full bg-white/25 px-4 py-2 text-sm font-extrabold transition-colors group-hover:bg-white/40">
          Ver cómo funciona
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </button>
    </div>
  );
}
