import type { Metadata } from "next";
import { LandingUIProvider } from "@/components/landing/landing-ui-provider";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { LisaIntro } from "@/components/landing/lisa-intro";
import { LandingScrollEffects } from "@/components/landing/landing-scroll-effects";
import { Marquesina } from "@/components/landing/marquesina";
import { QueEs } from "@/components/landing/que-es";
import { Cursos } from "@/components/landing/cursos";
import { Equipo } from "@/components/landing/equipo";
import { CtaFinal } from "@/components/landing/cta-final";
import { LandingFooter } from "@/components/landing/landing-footer";
import "./landing.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <LandingUIProvider>
      <div
        id="top"
        className="landing-root bg-background text-text relative min-h-screen overflow-x-clip"
      >
        <LandingScrollEffects />
        <div
          aria-hidden
          className="landing-page-progress bg-primary pointer-events-none fixed top-0 left-0 z-50 h-1 w-full origin-left"
        />
        <Nav />
        <Hero />
        <Marquesina />
        <QueEs />
        <LisaIntro />
        <Cursos />
        <Equipo />
        <CtaFinal />
        <LandingFooter />
      </div>
    </LandingUIProvider>
  );
}
