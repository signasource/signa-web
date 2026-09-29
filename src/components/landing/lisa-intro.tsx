import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/** "Conocé a Lisa": Lisa introduces herself next to the app's home screen. */
export function LisaIntro() {
  return (
    <section id="lisa" className="relative px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-4.5 lg:order-2">
          <p className="text-primary text-sm font-extrabold tracking-[2px]">
            ESTO ES SIGNA · TU GUÍA
          </p>
          <h2
            data-reveal="up"
            className="font-display max-w-[520px] text-4xl leading-[0.98] font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Conocé a Lisa, tu guía en cada lección.
          </h2>
          <p data-reveal="up" className="text-text-muted max-w-md text-lg leading-snug">
            Entrás a una lección, elegís el significado de la seña y Lisa te la muestra con su
            cuerpo, en 3D y desde todos los ángulos.
          </p>
          <div className="mt-1.5 flex flex-col items-start gap-2.5">
            <p
              data-reveal="pop"
              style={delay(0)}
              className="bg-fill origin-bottom-left rounded-[18px] rounded-bl-[4px] px-4 py-2.5 text-[15px] font-bold"
            >
              ¡Hola! Soy Lisa.
            </p>
            <p
              data-reveal="pop"
              style={delay(350)}
              className="bg-fill ml-6 origin-bottom-left rounded-[18px] rounded-bl-[4px] px-4 py-2.5 text-[15px] font-bold"
            >
              Te muestro cada seña desde todos los ángulos.
            </p>
            <p
              data-reveal="pop"
              style={delay(700)}
              className="bg-accent-amber text-text ml-12 origin-bottom-left rounded-[18px] rounded-bl-[4px] px-4 py-2.5 text-[15px] font-extrabold"
            >
              ¿Arrancamos con tu primera lección?
            </p>
            <Link
              href="#probar"
              data-reveal="pop"
              style={delay(1050)}
              className="landing-btn bg-primary text-on-primary mt-1 self-end rounded-[18px] rounded-br-[4px] px-4 py-2.5 text-[15px] font-extrabold sm:ml-24 sm:self-auto"
            >
              ¡Dale! Mostrame una seña ↑
            </Link>
          </div>
        </div>

        <div
          data-reveal="left"
          className="landing-stage-wrap lg:order-1"
          style={{ "--stage-w": "560px", "--stage-h": "660px" } as CSSProperties}
        >
          <div className="landing-stage">
            <div
              aria-hidden
              className="bg-primary-light absolute top-[90px] left-[20px] h-[520px] w-[520px] rounded-full"
            />
            <div
              aria-hidden
              className="bg-accent-teal absolute top-[70px] left-[40px] h-[70px] w-[70px] rounded-full"
            />
            <div className="absolute top-[10px] left-[40px] z-10 rotate-3">
              <div className="bg-text rounded-[46px] p-2.5 shadow-2xl">
                <HomeScreen />
              </div>
            </div>
            <Image
              src="/images/lisa-arms-crossed.png"
              alt="Lisa, la guía de Signa, con los brazos cruzados"
              width={526}
              height={950}
              className="absolute top-[150px] left-[300px] z-20 h-[500px] w-[277px]"
            />
            <div className="landing-floaty2 bg-surface absolute top-[520px] left-[0px] z-30 flex items-center gap-2 rounded-full py-2.5 pr-4 pl-2.5 text-sm font-bold shadow-lg">
              <span className="bg-success-light text-success-dark flex h-7.5 w-7.5 items-center justify-center rounded-full">
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
    <div className="bg-background flex h-[620px] w-[280px] flex-col overflow-hidden rounded-[37px]">
      <div className="bg-primary text-on-primary relative overflow-hidden px-4 pt-8 pb-4">
        <div
          aria-hidden
          className="bg-primary-dark/40 absolute -top-20 -right-12 h-[190px] w-[190px] rounded-full"
        />
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
          <div className="bg-primary-light text-primary flex h-9 w-9 items-center justify-center rounded-xl">
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 11V8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 15l-1.6-3a1.5 1.5 0 0 1 2.6-1.5L7 12" />
            </svg>
          </div>
          <div>
            <p className="text-text-muted text-[9px] font-bold tracking-wide">UNIDAD 1 · 2/5</p>
            <p className="font-display text-sm font-bold">Primeros pasos</p>
          </div>
        </div>
        {[
          { title: "Lección 1", state: "done" },
          { title: "Lección 2", state: "done" },
          { title: "Lección 3", state: "current" },
          { title: "Lección 4", state: "locked" },
        ].map((lesson) =>
          lesson.state === "current" ? (
            <div key={lesson.title} className="border-primary bg-surface rounded-2xl border p-3">
              <p className="text-primary text-[9px] font-bold tracking-wide">EN CURSO</p>
              <p className="font-display text-sm font-bold">{lesson.title}</p>
              <div className="bg-fill mt-2 h-1.5 rounded-full">
                <div className="bg-primary h-1.5 w-[40%] rounded-full" />
              </div>
            </div>
          ) : (
            <div
              key={lesson.title}
              className="border-border bg-surface flex items-center justify-between rounded-2xl border p-3"
            >
              <p
                className={
                  lesson.state === "locked"
                    ? "font-display text-text-muted text-sm font-bold"
                    : "font-display text-sm font-bold"
                }
              >
                {lesson.title}
              </p>
              {lesson.state === "done" ? (
                <span className="bg-success-light text-success-dark rounded-full px-2 py-0.5 text-[9px] font-extrabold">
                  HECHA
                </span>
              ) : (
                <span className="text-text-muted text-[9px] font-extrabold">BLOQUEADA</span>
              )}
            </div>
          ),
        )}
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
