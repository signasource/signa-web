import Image from "next/image";
import type { CSSProperties } from "react";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

type LessonState = "done" | "current" | "locked";

const UNITS: ReadonlyArray<{
  title: string;
  icon: "hand" | "people" | "place";
  lessons: ReadonlyArray<{ title: string; state: LessonState }>;
}> = [
  {
    title: "Presentándonos",
    icon: "hand",
    lessons: [
      { title: "Deletreá tu nombre", state: "done" },
      { title: "Yo, vos, nombre, sordo, oyente", state: "done" },
      { title: "Hola, chau, ¿cómo estás?, bien, mal", state: "current" },
      { title: "Gracias, por favor, perdón, de nada", state: "locked" },
    ],
  },
  {
    title: "Las personas a nuestro alrededor",
    icon: "people",
    lessons: [
      { title: "Familia, mamá, papá, hermano/a, hijo/a, abuelo/a", state: "locked" },
      { title: "Amigo/a, novio/a, esposo/a, compañero/a", state: "locked" },
      { title: "Hombre, mujer, niña, niño, bebé", state: "locked" },
    ],
  },
  {
    title: "Lugares",
    icon: "place",
    lessons: [
      { title: "Escuela, universidad, museo, jardín de infantes", state: "locked" },
      { title: "Comercio, plaza, comisaría, hospital", state: "locked" },
    ],
  },
];

const UNIT_ICONS = {
  hand: "M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 11V8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 15l-1.6-3a1.5 1.5 0 0 1 2.6-1.5L7 12",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  place:
    "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
} as const;

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
            Lisa te enseña de forma guiada, de lección en lección, todas las señas con un avatar 3D
            que se puede ver desde todos los ángulos.
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
              className="bg-primary/8 absolute top-[90px] left-[20px] h-[520px] w-[520px] rounded-full"
            />
            <div
              aria-hidden
              className="landing-floaty bg-accent-teal absolute top-[70px] left-[40px] h-[70px] w-[70px] rounded-full"
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

function HomeScreen() {
  return (
    <div className="bg-background flex h-[620px] w-[280px] flex-col overflow-hidden rounded-[37px]">
      <div className="bg-primary text-on-primary relative overflow-hidden px-4 pt-8 pb-4">
        <div
          aria-hidden
          className="bg-primary-dark/40 absolute -top-20 -right-12 h-[190px] w-[190px] rounded-full"
        />
        <p className="font-display relative text-2xl font-bold tracking-tight">Tu recorrido</p>
        <p className="relative mt-1 max-w-[210px] text-[12px] leading-tight opacity-90">
          Seguí la ruta lección por lección y sumá señas todos los días.
        </p>
        <div className="relative mt-3 grid grid-cols-3 gap-1.5">
          <StatChip label="RACHA" value="12" />
          <StatChip label="GEMAS" value="340" />
          <StatChip label="XP" value="1.250" />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden px-4 pb-3">
        <div
          aria-hidden
          className="bg-primary/20 absolute top-[30px] bottom-0 left-[31px] w-[2px]"
        />
        {UNITS.map((unit, u) => {
          const done = unit.lessons.filter((l) => l.state === "done").length;
          const open = unit.lessons.some((l) => l.state !== "locked");
          return (
            <div key={unit.title}>
              <div className="flex items-center gap-2.5 pt-3.5 pb-1">
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    open ? "bg-primary-light text-primary" : "bg-fill text-text-muted"
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={UNIT_ICONS[unit.icon]} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-text-muted text-[8.5px] font-bold tracking-wide">
                    UNIDAD {u + 1} · {done}/{unit.lessons.length}
                  </p>
                  <p
                    className={`font-display truncate text-[12.5px] font-bold ${
                      open ? "" : "text-text-muted"
                    }`}
                  >
                    {unit.title}
                  </p>
                </div>
              </div>

              <ul className="flex flex-col pt-1">
                {unit.lessons.map((lesson) => (
                  <LessonRow key={lesson.title} {...lesson} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LessonRow({ title, state }: { title: string; state: LessonState }) {
  return (
    <li className="flex items-center gap-2.5 py-[5px]">
      <div className="flex w-8 shrink-0 justify-center">
        <div
          className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full ${
            state === "done"
              ? "bg-success"
              : state === "current"
                ? "bg-primary ring-primary/30 ring-2"
                : "border-border bg-fill border"
          }`}
        >
          {state === "done" && (
            <svg
              aria-hidden="true"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
          {state === "current" && <div className="h-2 w-2 rounded-full bg-white" />}
          {state === "locked" && (
            <svg
              aria-hidden="true"
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-text-muted"
            >
              <rect x="6" y="11" width="12" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          )}
        </div>
      </div>

      {state === "current" ? (
        <div className="border-primary bg-surface min-w-0 flex-1 rounded-xl border p-2">
          <p className="text-primary text-[8px] font-bold tracking-wide">EN CURSO</p>
          <p className="font-display text-[12px] leading-tight font-bold">{title}</p>
          <div className="bg-fill mt-1.5 h-1 rounded-full">
            <div className="bg-primary h-1 w-[40%] rounded-full" />
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5">
          <p
            className={`font-display truncate text-[12px] leading-tight font-bold ${
              state === "locked" ? "text-text-muted" : ""
            }`}
          >
            {title}
          </p>
          {state === "done" && (
            <span className="bg-success-light text-success-dark shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold">
              HECHA
            </span>
          )}
        </div>
      )}
    </li>
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
