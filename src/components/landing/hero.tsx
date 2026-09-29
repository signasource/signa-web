import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { OrgTrigger } from "@/components/landing/org-trigger";
import { LessonDemo } from "@/components/landing/lesson-demo";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/**
 * Above-the-fold hero: headline + CTAs, and a phone mockup running a playable lesson with Lisa
 * signing in 3D. Plain document flow — no pinned/scroll-jacked section. The mockup sits on a
 * fixed design canvas scaled per breakpoint (`landing-stage`, see landing.css).
 */
export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 px-5 pt-8 pb-16 sm:px-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-2 lg:gap-10 lg:py-10">
        <div className="flex flex-col items-start gap-6 sm:gap-7">
          <h1
            className="landing-enter font-display text-[44px] leading-[0.96] font-extrabold tracking-tight text-balance sm:text-7xl"
            style={delay(0)}
          >
            Aprendé a comunicarte con las <span className="text-primary">manos</span>.
          </h1>
          <p
            className="landing-enter text-text-muted max-w-md text-lg leading-snug sm:text-xl"
            style={delay(120)}
          >
            Signa te enseña LSA con lecciones cortas, señas en 3D y una cámara que reconoce tus
            manos en tiempo real. Con Lisa como guía, desde la primera seña.
          </p>
          <div className="landing-enter flex flex-wrap gap-3" style={delay(240)}>
            <Link
              href="#empezar"
              className="landing-btn bg-text text-on-dark flex min-h-14 items-center gap-2.5 rounded-full px-7 text-[17px] font-bold"
            >
              Empezá gratis
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <OrgTrigger className="landing-btn border-border bg-surface text-text flex min-h-14 items-center rounded-full border-[1.5px] px-6.5 text-[17px] font-bold">
              Soy una organización
            </OrgTrigger>
          </div>
          <p
            className="landing-enter text-text-muted flex items-center gap-2.5 text-sm font-semibold"
            style={delay(360)}
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 11V6a1.5 1.5 0 0 1 3 0v5M12 10V4.5a1.5 1.5 0 0 1 3 0V10M15 10.5V7a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 14l-1.3-2.4a1.5 1.5 0 0 1 2.6-1.5L8 13" />
            </svg>
            <span>
              <span className="lg:hidden">Probala abajo:</span>
              <span className="hidden lg:inline">Probala acá al lado:</span> elegí una respuesta o
              arrastrá a Lisa para girarla.
            </span>
          </p>
        </div>

        {/* Stage: circular backdrop, phone running the lesson demo, Lisa waving */}
        <div
          id="probar"
          className="landing-stage-wrap landing-enter"
          style={{ ...delay(200), "--stage-w": "600px", "--stage-h": "680px" } as CSSProperties}
        >
          <div className="landing-stage">
            <div
              aria-hidden
              className="landing-spin border-primary-medallion absolute top-[60px] left-[20px] h-[560px] w-[560px] rounded-full border-2 border-dashed"
            />
            <div
              aria-hidden
              className="bg-primary absolute top-[100px] left-[60px] h-[480px] w-[480px] rounded-full"
            />
            <div
              aria-hidden
              className="bg-accent-amber absolute top-[80px] left-[450px] h-[84px] w-[84px] rounded-full"
            />
            <div
              aria-hidden
              className="bg-accent-teal absolute top-[540px] left-[40px] h-[50px] w-[50px] rounded-full"
            />

            <Image
              src="/images/lisa-waving.png"
              alt="Lisa, la guía de Signa, saludando"
              width={800}
              height={800}
              priority
              className="absolute top-[200px] left-[250px] h-[480px] w-[480px]"
            />

            <div className="absolute top-[20px] left-[90px] z-10 -rotate-3">
              <div className="bg-text rounded-[46px] p-2.5 shadow-2xl">
                <LessonDemo className="h-[620px] w-[280px] overflow-hidden rounded-[37px]" />
              </div>
            </div>

            <div className="landing-floaty bg-surface absolute top-[10px] left-[400px] z-20 flex items-center gap-2 rounded-full py-2.5 pr-4 pl-2.5 text-sm font-bold shadow-lg">
              <span className="bg-shop-amber-light text-streak-orange flex h-7.5 w-7.5 items-center justify-center rounded-full">
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 0 2 1 3 2 3 0-3-1-6.5.5-9z" />
                </svg>
              </span>
              12 días de racha
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
