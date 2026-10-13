import type { Metadata } from "next";
import Image from "next/image";
import { BackButton } from "@/components/back-button";
import { LandingUIProvider } from "@/components/landing/landing-ui-provider";
import { Nav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { OrgTrigger } from "@/components/landing/org-trigger";
import { WaitlistForm } from "@/app/(marketing)/proximamente/waitlist-form";
import "@/app/(marketing)/landing.css";

export const metadata: Metadata = {
  title: "Signa · Próximamente en Google Play",
  alternates: { canonical: "/proximamente" },
};

export default function ProximamentePage() {
  return (
    <LandingUIProvider>
      <div className="bg-background text-text flex min-h-screen flex-col">
        <Nav />
        <main className="page-enter relative flex flex-1 flex-col items-center justify-center px-5 py-24 sm:px-8">
          <BackButton href="/" />
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-14 lg:grid-cols-2">
            <div className="flex flex-col gap-7">
              <div className="flex items-center gap-3">
                <span className="bg-accent-amber text-text rounded-full px-4 py-2 text-[13px] font-extrabold tracking-wide">
                  MUY PRONTO
                </span>
              </div>
              <h1 className="font-display text-5xl leading-[0.96] font-extrabold tracking-tight text-balance sm:text-6xl">
                La app está lista. Estamos subiéndola a{" "}
                <span className="text-primary">Google Play</span>.
              </h1>
              <p className="text-text-muted max-w-md text-lg leading-relaxed">
                Signa ya está desarrollada y pronto vas a poder descargarla gratis. Dejá tu mail y
                te avisamos cuando esté disponible.
              </p>
              <WaitlistForm />
              <div className="border-border mt-2 rounded-2xl border p-5">
                <p className="font-display text-base font-bold">¿Sos una organización?</p>
                <p className="text-text-muted mt-1 text-[14.5px] leading-snug">
                  Podés capacitar a tu equipo en Lengua de Señas Argentina con cursos temáticos.
                </p>
                <OrgTrigger className="landing-btn border-border bg-fill mt-3 flex min-h-10 items-center gap-1.5 self-start rounded-full border px-4 text-sm font-bold">
                  Ver más sobre organizaciones
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </OrgTrigger>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative self-center">
                <Image
                  src="/images/lisa-arms-crossed.png"
                  alt="Lisa, la guía de Signa"
                  width={526}
                  height={950}
                  className="h-[420px] w-auto"
                />
              </div>
            </div>
          </div>
        </main>
        <LandingFooter />
      </div>
    </LandingUIProvider>
  );
}
