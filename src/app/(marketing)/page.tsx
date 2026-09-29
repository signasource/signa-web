import type { Metadata } from "next";
import { LandingUIProvider } from "@/components/landing/landing-ui-provider";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Marquesina } from "@/components/landing/marquesina";
import { QueEs } from "@/components/landing/que-es";
import { ParaQuien } from "@/components/landing/para-quien";
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
      <div id="top" className="relative min-h-screen overflow-x-clip bg-background text-text">
        <div aria-hidden className="landing-page-progress fixed left-0 top-0 z-50 h-1 w-full origin-left bg-primary" />
        <Nav />
        <Hero />
        <Marquesina />
        <QueEs />
        <ParaQuien />
        <Cursos />
        <Equipo />
        <CtaFinal />
        <LandingFooter />
      </div>
    </LandingUIProvider>
  );
}
