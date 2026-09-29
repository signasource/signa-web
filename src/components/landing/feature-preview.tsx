"use client";

import Image from "next/image";
import { FeatureId, useLandingUI } from "@/components/landing/landing-ui-context";
import { CloseButton } from "@/components/landing/close-button";

const ANSWERS = ["Chau", "Hola", "Gracias", "Perdón"] as const;

function AnswerGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ANSWERS.map((word) => (
        <div
          key={word}
          className={
            word === "Hola"
              ? "border-success bg-success-light text-success-dark flex h-11 items-center justify-center gap-1.5 rounded-2xl border-2 text-[13px] font-extrabold"
              : "bg-fill flex h-11 items-center justify-center rounded-2xl text-[13px] font-bold"
          }
        >
          {word === "Hola" && (
            <svg
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
          {word}
        </div>
      ))}
    </div>
  );
}

function SignsPhone() {
  return (
    <div className="bg-text justify-self-center rounded-[46px] p-2.5 shadow-2xl">
      <div className="bg-background flex h-[620px] w-[280px] flex-col gap-3.5 overflow-hidden rounded-[37px] p-4 pt-7">
        <div className="flex items-center gap-2.5">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="stroke-text-muted"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          <div className="bg-fill-dark h-2.5 flex-grow rounded-full">
            <div className="bg-primary h-2.5 w-[42%] rounded-full" />
          </div>
          <div className="text-danger flex items-center gap-1 text-[13px] font-extrabold">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />
            </svg>
            5
          </div>
        </div>
        <div className="bg-primary-light relative h-[340px] overflow-hidden rounded-[22px]">
          <Image
            src="/images/lisa-arms-crossed.png"
            alt="Lisa mostrando una seña en 3D"
            width={200}
            height={408}
            className="absolute top-4 left-1/2 h-[408px] w-[200px] -translate-x-1/2 object-cover object-top"
          />
          <span className="bg-surface text-primary-dark absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold">
            3D
          </span>
        </div>
        <p className="font-display text-[17px] font-bold tracking-tight">
          ¿Qué significa esta seña?
        </p>
        <AnswerGrid />
      </div>
    </div>
  );
}

function CameraPhone() {
  return (
    <div className="bg-text justify-self-center rounded-[46px] p-2.5 shadow-2xl">
      <div className="bg-ink-900 text-on-dark h-[620px] w-[280px] overflow-hidden rounded-[37px]">
        <div className="flex items-center gap-2.5 px-4 pt-7">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          <div className="bg-ink-700 h-2.5 flex-grow rounded-full">
            <div className="bg-course-teal h-2.5 w-[72%] rounded-full" />
          </div>
        </div>
        <div className="bg-surface text-text mx-4 mt-3.5 rounded-2xl p-3.5">
          <p className="text-text-muted text-[10px] font-extrabold tracking-wider">HACÉ LA SEÑA</p>
          <p className="font-display text-2xl font-extrabold tracking-tight">Hola</p>
        </div>
        <div className="bg-ink-800 relative mx-4 mt-3.5 h-[240px] overflow-hidden rounded-[22px]">
          <div className="bg-ink-900/70 absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10.5px] font-bold">
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              className="stroke-course-teal"
              strokeWidth="2.6"
              strokeLinejoin="round"
            >
              <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
            </svg>
            Se procesa en tu teléfono
          </div>
        </div>
        <div className="bg-success mx-4 mt-3.5 flex h-[50px] items-center justify-center gap-2 rounded-2xl font-extrabold text-white">
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          ¡Te salió!
        </div>
      </div>
    </div>
  );
}

function StreakPhone() {
  return (
    <div className="bg-text justify-self-center rounded-[46px] p-2.5 shadow-2xl">
      <div className="bg-background flex h-[620px] w-[280px] flex-col overflow-hidden rounded-[37px]">
        <div className="bg-primary text-on-primary px-4 pt-8 pb-4">
          <p className="font-display text-xl font-bold tracking-tight">Tu recorrido</p>
          <p className="mt-1 max-w-[210px] text-[11.5px] leading-tight opacity-90">
            Seguí la ruta lección por lección y sumá señas todos los días.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <div className="rounded-xl bg-white/15 px-2 py-1.5">
              <p className="text-[8px] font-bold tracking-wide opacity-80">RACHA</p>
              <p className="font-display mt-0.5 text-base font-bold">12</p>
            </div>
            <div className="rounded-xl bg-white/15 px-2 py-1.5">
              <p className="text-[8px] font-bold tracking-wide opacity-80">GEMAS</p>
              <p className="font-display mt-0.5 text-base font-bold">340</p>
            </div>
            <div className="rounded-xl bg-white/15 px-2 py-1.5">
              <p className="text-[8px] font-bold tracking-wide opacity-80">XP</p>
              <p className="font-display mt-0.5 text-base font-bold">1.250</p>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3.5">
          <div className="border-primary bg-surface rounded-2xl border p-3">
            <p className="text-primary text-[9px] font-bold tracking-wide">EN CURSO</p>
            <p className="font-display text-sm font-bold">Lección 3</p>
            <div className="bg-fill mt-2 h-1.5 rounded-full">
              <div className="bg-primary h-1.5 w-[40%] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CONTENT: Record<
  FeatureId,
  { eyebrow: string; eyebrowClass: string; title: string; body: string; phone: React.ReactNode }
> = {
  signs: {
    eyebrow: "SEÑAS EN 3D",
    eyebrowClass: "text-primary",
    title: "Cada seña, en 3D y desde todos los ángulos.",
    body: "Lisa te muestra la seña y vos la reconocés. Las lecciones son cortas y combinan ejercicios distintos: elegí el significado, elegí la seña, uní pares y respondé en contexto.",
    phone: <SignsPhone />,
  },
  camera: {
    eyebrow: "TU CÁMARA TE CORRIGE",
    eyebrowClass: "text-course-teal",
    title: "Hacé la seña. Signa te dice si te salió.",
    body: "La cámara reconoce tus manos en tiempo real, también para deletrear tu nombre con el alfabeto manual. Todo se procesa en tu celular: ningún video sale de tu teléfono.",
    phone: <CameraPhone />,
  },
  streak: {
    eyebrow: "UN RATITO POR DÍA",
    eyebrowClass: "text-shop-amber",
    title: "Tu racha, tus gemas y tu XP, de un vistazo.",
    body: "Elegí tu meta diaria de 5 a 20 minutos. Cada lección suma a tu racha y a tu experiencia, y podés ver tu recorrido lección por lección.",
    phone: <StreakPhone />,
  },
};

export function FeaturePreview({ feature }: { feature: FeatureId }) {
  const { closeFeature } = useLandingUI();
  const content = CONTENT[feature];

  return (
    <div className="landing-modal-in bg-text/55 fixed inset-0 z-50 overflow-y-auto p-5 backdrop-blur-sm">
      <div className="landing-modal-card bg-background relative mx-auto grid max-w-3xl grid-cols-1 items-center gap-10 rounded-[40px] p-8 sm:grid-cols-[minmax(0,1fr)_300px] sm:p-14">
        <CloseButton onClick={closeFeature} className="absolute top-6 right-6" />
        <div className="flex flex-col gap-4">
          <p className={`text-sm font-extrabold tracking-[2px] ${content.eyebrowClass}`}>
            {content.eyebrow}
          </p>
          <h3 className="font-display text-4xl leading-tight font-extrabold tracking-tight">
            {content.title}
          </h3>
          <p className="text-text-muted text-[17px] leading-relaxed">{content.body}</p>
        </div>
        {content.phone}
      </div>
    </div>
  );
}
