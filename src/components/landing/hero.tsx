import Image from "next/image";
import Link from "next/link";
import { OrgTrigger } from "@/components/landing/org-trigger";

/**
 * Hero + "Conocé a Lisa" merged into one pinned, scroll-driven section (the "magic scroll"):
 * scrolling through it crossfades the headline into Lisa's introduction, and the phone mockup
 * from the home screen into a lesson screen, all within the same circular backdrop. Pure CSS
 * (landing.css `--hero` view-timeline) — no JS. See docs/features/landing.md.
 */
export function Hero() {
  return (
    <section className="landing-hero relative -mt-[72px] h-[2500px]">
      <div id="lisa" aria-hidden className="absolute left-0 top-[760px] h-px w-px scroll-mt-24" />
      <div className="landing-hero-pin sticky top-0 flex h-[900px] items-center pt-[72px]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-8 md:grid-cols-2">
          <div className="relative min-h-[420px]">
            {/* Act 1 — headline */}
            <div className="landing-h-copy flex flex-col items-start gap-7">
              <h1 className="font-display text-6xl font-extrabold leading-[0.96] tracking-tight text-balance sm:text-7xl">
                Aprendé a comunicarte con las <span className="text-primary">manos</span>.
              </h1>
              <p className="max-w-md text-xl leading-snug text-text-muted">
                Signa te enseña LSA con lecciones cortas, señas en 3D y una cámara que reconoce
                tus manos en tiempo real. Con Lisa como guía, desde la primera seña.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="#empezar"
                  className="landing-btn flex min-h-14 items-center gap-2.5 rounded-full bg-text px-7 text-[17px] font-bold text-on-dark"
                >
                  Empezá gratis
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <OrgTrigger className="landing-btn flex min-h-14 items-center rounded-full border-[1.5px] border-border bg-surface px-6.5 text-[17px] font-bold text-text">
                  Soy una organización
                </OrgTrigger>
              </div>
              <div className="landing-h-hint mt-5 flex items-center gap-2.5 text-sm font-semibold text-text-muted">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="7" y="3" width="10" height="18" rx="5" />
                  <path d="M12 7v3" />
                </svg>
                Scrolleá para conocer la app
              </div>
            </div>

            {/* Act 2 — Conocé a Lisa */}
            <div className="landing-h-copy2 absolute inset-0 flex flex-col items-start gap-4.5">
              <p className="text-sm font-extrabold tracking-[2px] text-primary">ESTO ES SIGNA · TU GUÍA</p>
              <h2 className="font-display max-w-[520px] text-5xl font-extrabold leading-[0.98] tracking-tight text-balance">
                Conocé a Lisa, tu guía en cada lección.
              </h2>
              <p className="max-w-md text-lg leading-snug text-text-muted">
                Entrás a una lección, elegís el significado de la seña y Lisa te la muestra con su
                cuerpo, en 3D y desde todos los ángulos.
              </p>
              <div className="mt-1.5 flex flex-col items-start gap-2.5">
                <p className="rounded-[18px] rounded-bl-[4px] bg-fill px-4 py-2.5 text-[15px] font-bold">
                  ¡Hola! Soy Lisa.
                </p>
                <p className="ml-6 rounded-[18px] rounded-bl-[4px] bg-fill px-4 py-2.5 text-[15px] font-bold">
                  Te muestro cada seña desde todos los ángulos.
                </p>
                <p className="ml-12 rounded-[18px] rounded-bl-[4px] bg-accent-amber px-4 py-2.5 text-[15px] font-extrabold text-text">
                  ¿Arrancamos con tu primera lección?
                </p>
              </div>
            </div>
          </div>

          {/* Stage: circular backdrop, phone mockup, Lisa */}
          <div className="landing-h-stage relative h-[700px] w-[560px] justify-self-center">
            <div aria-hidden className="landing-spin absolute -left-2.5 top-[50px] h-[600px] w-[600px] rounded-full border-2 border-dashed border-primary-medallion" />
            <div aria-hidden className="landing-h-blob absolute left-[30px] top-[90px] h-[520px] w-[520px] rounded-full bg-primary" />
            <div aria-hidden className="absolute left-[380px] top-[70px] h-[90px] w-[90px] rounded-full bg-accent-amber" />
            <div aria-hidden className="absolute left-[10px] top-[520px] h-[54px] w-[54px] rounded-full bg-accent-teal" />

            <div className="landing-h-phone absolute left-[30px] top-[40px] z-10">
              <div className="h-[640px] w-[300px] rounded-[46px] bg-text p-2.5 shadow-2xl">
                <div className="relative h-[620px] w-[280px] overflow-hidden rounded-[37px] bg-background">
                  <HomeScreen />
                  <LessonScreen />
                </div>
              </div>
            </div>

            <Image
              src="/images/lisa-waving.png"
              alt="Lisa, la guía de Signa, saludando"
              width={280}
              height={540}
              priority
              className="landing-h-lisa absolute -right-[110px] bottom-[-20px] z-20 h-[540px] w-auto"
            />
            <Image
              src="/images/lisa-arms-crossed.png"
              alt="Lisa, la guía de Signa, con los brazos cruzados"
              width={240}
              height={460}
              className="landing-h-lisa2 absolute -right-[90px] bottom-[-10px] z-20 h-[460px] w-auto"
            />

            <div className="landing-h-chip landing-floaty absolute right-[30px] top-[10px] z-20 flex items-center gap-2 rounded-full bg-surface py-2.5 pl-2.5 pr-4 text-sm font-bold shadow-lg">
              <span className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-shop-amber-light text-streak-orange">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 0 2 1 3 2 3 0-3-1-6.5.5-9z" />
                </svg>
              </span>
              12 días de racha
            </div>
            <div className="landing-h-chip landing-floaty2 absolute left-[-30px] top-[470px] z-20 flex items-center gap-2 rounded-full bg-surface py-2.5 pl-2.5 pr-4 text-sm font-bold shadow-lg">
              <span className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-success-light text-success-dark">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              ¡Seña correcta! +15 XP
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeScreen() {
  return (
    <div className="landing-h-home absolute inset-0 flex flex-col">
      <div className="relative overflow-hidden bg-primary px-4 pb-4 pt-8 text-on-primary">
        <div aria-hidden className="absolute -right-12 -top-20 h-[190px] w-[190px] rounded-full bg-primary-dark/40" />
        <p className="font-display relative text-2xl font-bold tracking-tight">Tu recorrido</p>
        <p className="relative mt-1 max-w-[210px] text-[11.5px] leading-tight opacity-90">
          Seguí la ruta lección por lección y sumá señas todos los días.
        </p>
        <div className="relative mt-3 grid grid-cols-3 gap-1.5">
          <StatChip label="RACHA" value="12" />
          <StatChip label="GEMAS" value="340" />
          <StatChip label="XP" value="1.250" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-3.5 pt-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 11V8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 15l-1.6-3a1.5 1.5 0 0 1 2.6-1.5L7 12" />
            </svg>
          </div>
          <div>
            <p className="text-[9px] font-bold tracking-wide text-text-muted">UNIDAD 1 · 2/5</p>
            <p className="font-display text-sm font-bold">Primeros pasos</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3">
          <p className="text-[9px] font-bold tracking-wide text-primary">EN CURSO</p>
          <p className="font-display text-sm font-bold">Lección 3</p>
          <div className="mt-2 h-1.5 rounded-full bg-fill">
            <div className="h-1.5 w-[40%] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 px-2 py-1.5">
      <p className="text-[8px] font-bold tracking-wide opacity-80">{label}</p>
      <p className="font-display mt-0.5 text-base font-bold">{value}</p>
    </div>
  );
}

function LessonScreen() {
  return (
    <div className="landing-h-lesson absolute inset-0 flex flex-col justify-center gap-3 bg-background px-4 pt-7">
      <div className="flex items-center gap-2.5">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="stroke-text-muted">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
        <div className="h-2.5 flex-grow rounded-full bg-fill-dark">
          <div className="h-2.5 w-[42%] rounded-full bg-primary" />
        </div>
        <div className="flex items-center gap-1 text-xs font-extrabold text-danger">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />
          </svg>
          5
        </div>
      </div>
      <div className="relative h-[320px] overflow-hidden rounded-[20px] bg-primary-light">
        <Image
          src="/images/lisa-arms-crossed.png"
          alt="Lisa mostrando una seña en 3D"
          width={176}
          height={380}
          className="absolute left-1/2 top-3.5 h-[380px] w-[176px] -translate-x-1/2 object-cover object-top"
        />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-surface px-2.5 py-1 text-[10px] font-extrabold text-primary-dark">
          3D
        </span>
      </div>
      <p className="font-display text-base font-bold tracking-tight">¿Qué significa esta seña?</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex h-10 items-center justify-center rounded-2xl bg-fill text-[12.5px] font-bold">Chau</div>
        <div className="flex h-10 items-center justify-center gap-1.5 rounded-2xl border-2 border-success bg-success-light text-[12.5px] font-extrabold text-success-dark">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Hola
        </div>
        <div className="flex h-10 items-center justify-center rounded-2xl bg-fill text-[12.5px] font-bold">Gracias</div>
        <div className="flex h-10 items-center justify-center rounded-2xl bg-fill text-[12.5px] font-bold">Perdón</div>
      </div>
    </div>
  );
}
