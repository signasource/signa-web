"use client";

import { useLandingUI } from "@/components/landing/landing-ui-context";

export function CtaFinal() {
  const { openFeature } = useLandingUI();

  return (
    <section className="bg-fill px-4 pb-4">
      <div className="bg-primary text-on-primary relative overflow-hidden rounded-[48px] pt-16 sm:pt-20">
        <div
          aria-hidden
          className="bg-primary-dark/40 absolute -bottom-40 -left-28 h-[480px] w-[480px] rounded-full"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-16 sm:px-8 lg:pb-24">
          <p className="text-on-primary/60 text-sm font-extrabold tracking-[2px]">
            SIN INSTALAR NADA, DESDE ESTA PÁGINA
          </p>

          <h2
            data-reveal="zoom"
            className="font-display w-full origin-left text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.94] font-extrabold tracking-tight"
          >
            ¿Te animás a empezar deletreando tu nombre en señas?
          </h2>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => openFeature("camera")}
              className="landing-btn border-on-primary/30 bg-on-primary/10 hover:bg-on-primary/20 flex min-h-14.5 w-full items-center justify-center gap-2.5 rounded-full border px-6 text-[17px] font-extrabold whitespace-nowrap sm:w-fit sm:px-7.5"
            >
              <svg
                aria-hidden="true"
                className="shrink-0"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Prender la cámara y probar
            </button>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3" aria-hidden>
              <SpellingTile letter="L" state="done" />
              <SpellingTile letter="I" state="done" />
              <SpellingTile letter="S" state="current" />
              <SpellingTile letter="A" state="pending" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpellingTile({
  letter,
  state,
}: {
  letter: string;
  state: "done" | "current" | "pending";
}) {
  if (state === "done") {
    return (
      <div className="bg-accent-teal flex h-14 w-14 items-center justify-center rounded-2xl sm:h-16 sm:w-16">
        <span className="font-display text-2xl font-extrabold text-white sm:text-3xl">
          {letter}
        </span>
      </div>
    );
  }

  if (state === "current") {
    return (
      <div className="landing-floaty flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white sm:h-16 sm:w-16">
        <span className="font-display text-2xl font-extrabold text-white sm:text-3xl">
          {letter}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-dashed border-white/30 sm:h-16 sm:w-16">
      <span className="font-display text-2xl font-extrabold text-white/30 sm:text-3xl">
        {letter}
      </span>
    </div>
  );
}
