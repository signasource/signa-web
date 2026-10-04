"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FeatureId, useLandingUI } from "@/components/landing/landing-ui-context";
import { CloseButton } from "@/components/landing/close-button";
import { LessonDemo } from "@/components/landing/lesson-demo";
import { LottiePlayer } from "@/components/landing/lottie-player";
import { CameraNameDemo } from "@/components/landing/camera-name-demo";

const LIVE_SCREEN = "h-[760px] w-[360px] overflow-hidden rounded-[37px]";

function LivePhone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="landing-live-phone">
      <div
        className={cn(
          "landing-live-phone-canvas bg-text rounded-[46px] p-2.5 shadow-2xl ring-4 ring-white/10",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SignsPhone() {
  return (
    <div className="justify-self-center pb-6">
      <div className="relative">
        <div
          aria-hidden
          className="landing-phone-ring2 bg-primary/15 absolute -inset-8 rounded-[58px]"
        />
        <div
          aria-hidden
          className="landing-phone-ring bg-primary/30 absolute -inset-5 rounded-[54px]"
        />
        <LivePhone className="hover:ring-primary/30 transition-shadow">
          <LessonDemo className={LIVE_SCREEN} viewerClassName="h-[440px]" />
        </LivePhone>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="bg-surface landing-floaty flex items-center gap-2 rounded-full py-2.5 pr-4 pl-2.5 text-sm font-bold shadow-xl">
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
          </span>
        </div>
      </div>
    </div>
  );
}

function CameraPhone() {
  return (
    <div className="justify-self-center">
      <LivePhone>
        <CameraNameDemo className={LIVE_SCREEN} />
      </LivePhone>
    </div>
  );
}

function StreakPhone() {
  return (
    <div className="bg-text justify-self-center rounded-[46px] p-2.5 shadow-2xl">
      <div
        className="flex h-[620px] w-[280px] flex-col overflow-hidden rounded-[37px] px-5 pt-10 pb-6"
        style={{ backgroundColor: "#FDA55A" }}
      >
        <div className="flex flex-1 items-center justify-center">
          <LottiePlayer src="/animations/streak-fire.json" className="h-[220px] w-[160px]" />
        </div>

        <div className="text-center">
          <p className="font-display text-[22px] leading-tight font-extrabold tracking-tight text-white">
            ¡Llegaste a 7 días de racha!
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-white/80">
            Seguís aprendiendo todos los días. ¡Así se hace!
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3.5">
          <LottiePlayer
            src="/animations/medals/silver.json"
            className="h-[60px] w-[60px] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-text-muted text-[10.5px] font-semibold">Logro desbloqueado</p>
            <p className="font-display text-[14px] leading-tight font-bold">Primera semana</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: "#29b6e81f", color: "#1b84ab" }}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                  <path d="M12 2a7 7 0 0 0-3.5 13.07V17h7v-1.93A7 7 0 0 0 12 2zm-1 15h2v1h-2zm0 2h2v1h-2z" />
                  <path d="M8.5 9.5C8.5 7.57 10.07 6 12 6s3.5 1.57 3.5 3.5c0 1.38-.8 2.58-1.97 3.18L13 13.28V15h-2v-1.72l-.53-.6A3.49 3.49 0 0 1 8.5 9.5z" />
                </svg>
                +10 gemas
              </span>
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: "#29b6e81f", color: "#1b84ab" }}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                +1 protector de racha
              </span>
            </div>
          </div>
        </div>

        <button
          className="mt-3.5 w-full rounded-2xl py-3 text-[13px] font-extrabold text-white"
          style={{ backgroundColor: "#e07020" }}
          tabIndex={-1}
          aria-hidden="true"
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
}

function SocialPhone() {
  const PODIUM = [
    {
      rank: 2,
      initials: "SG",
      firstName: "Sofia",
      xp: "1.890",
      avatar: "bg-primary-light text-primary-dark",
      ring: "ring-[#86868B]",
      bar: "bg-[#86868B]/20",
      barH: "h-[26px]",
      size: "h-9 w-9",
    },
    {
      rank: 1,
      initials: "MR",
      firstName: "Mati",
      xp: "2.340",
      avatar: "bg-avatar-teal-light text-avatar-teal-dark",
      ring: "ring-[#FBBF24]",
      bar: "bg-[#FBBF24]/30",
      barH: "h-[40px]",
      size: "h-10 w-10",
    },
    {
      rank: 3,
      initials: "JP",
      firstName: "Juan",
      xp: "980",
      avatar: "bg-shop-amber-light text-shop-amber-dark",
      ring: "ring-[#DE7211]",
      bar: "bg-[#DE7211]/20",
      barH: "h-[18px]",
      size: "h-9 w-9",
    },
  ];

  const LIST = [
    {
      rank: 4,
      initials: "AL",
      name: "Ana L.",
      handle: "@anal",
      streak: 8,
      xp: "750",
      delta: "↑ 2",
      deltaClass: "bg-success-light text-success-dark",
      avatar: "bg-avatar-blue-light text-gems-blue-dark",
    },
    {
      rank: 5,
      initials: "TU",
      name: "Vos",
      handle: "@usuario",
      streak: 12,
      xp: "1.250",
      delta: "—",
      deltaClass: "bg-fill text-text-muted",
      avatar: "bg-avatar-wine-light text-social-wine",
      isYou: true,
    },
  ];

  return (
    <div className="bg-text justify-self-center rounded-[46px] p-2.5 shadow-2xl">
      <div className="bg-background flex h-[620px] w-[280px] flex-col overflow-hidden rounded-[37px]">
        <div className="bg-social-wine relative overflow-hidden px-4 pt-7 pb-3 text-white">
          <div
            aria-hidden
            className="absolute -top-10 -right-8 h-[130px] w-[130px] rounded-full bg-white/10"
          />
          <p className="font-display relative text-2xl font-bold tracking-tight">Social</p>
          <p className="relative mt-0.5 text-[10.5px] opacity-85">
            Mirá qué están logrando tus amigos.
          </p>
          <div className="relative mt-2.5 flex gap-2">
            {[
              { label: "AMIGOS", value: "8" },
              { label: "SOLICITUDES", value: "2" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 px-2 py-1.5"
              >
                <p className="text-[7.5px] font-bold tracking-wide opacity-80">{s.label}</p>
                <p className="font-display text-sm font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-border flex border-b bg-white">
          {["Feed", "Amigos", "Ranking"].map((tab) => (
            <div
              key={tab}
              className={`px-3 pt-2 pb-2 text-[10.5px] font-bold ${
                tab === "Ranking"
                  ? "border-social-wine text-social-wine border-b-2"
                  : "text-text-muted"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden px-2.5 pt-2">
          <div className="bg-fill flex rounded-[10px] p-0.5 text-[9.5px] font-bold">
            <div className="bg-surface text-social-wine flex-1 rounded-[8px] py-1.5 text-center shadow-sm">
              Global (98)
            </div>
            <div className="text-text-muted flex-1 py-1.5 text-center">Mis amigos (8)</div>
          </div>

          <div className="border-border mt-1.5 flex items-center gap-1.5 rounded-xl border bg-white px-2.5 py-1.5">
            <svg
              aria-hidden="true"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="text-social-wine shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <p className="text-text-muted flex-1 text-[8.5px]">Se reinicia el lunes a las 00:00</p>
            <p className="font-display text-[10px] font-bold">2d 14:22</p>
          </div>

          <p className="text-text-muted mt-1.5 text-[8px] font-bold tracking-[0.6px]">
            XP DE ESTA SEMANA
          </p>

          <div className="border-border mt-1 flex items-end justify-around overflow-hidden rounded-[14px] border bg-white px-2 pt-2">
            {PODIUM.map((p) => (
              <div key={p.rank} className="flex flex-col items-center gap-0.5">
                <div
                  className={`font-display flex shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ring-2 ${p.avatar} ${p.size} ${p.ring}`}
                >
                  {p.initials}
                </div>
                <div className="bg-social-wine rounded-full px-1.5 py-px text-[7px] font-extrabold text-white">
                  #{p.rank}
                </div>
                <p className="text-[8.5px] font-semibold">{p.firstName}</p>
                <p className="text-text-muted text-[7.5px]">⚡ {p.xp}</p>
                <div className={`w-full rounded-t-sm ${p.bar} ${p.barH}`} />
              </div>
            ))}
          </div>

          <div className="border-border mt-1.5 overflow-hidden rounded-[14px] border bg-white">
            {LIST.map((r, i) => (
              <div
                key={r.rank}
                className={`flex items-center gap-2 px-2.5 py-2 ${i < LIST.length - 1 ? "border-border border-b" : ""} ${r.isYou ? "bg-avatar-wine-light" : ""}`}
              >
                <p className="text-text-muted font-display w-3.5 text-right text-[9.5px] font-bold">
                  #{r.rank}
                </p>
                <span
                  className={`font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold ${r.avatar}`}
                >
                  {r.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[11px] font-bold">{r.name}</p>
                  <p className="text-text-muted text-[8px]">🔥 {r.streak} días</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`rounded-[5px] px-1 py-px text-[7px] font-bold ${r.deltaClass}`}>
                    {r.delta}
                  </span>
                  <p className="font-display text-[9.5px] font-extrabold">⚡ {r.xp}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-social-wine/40 bg-avatar-wine-light -mx-2.5 mt-auto flex items-center gap-2 border-t px-3.5 py-2">
            <p className="font-display text-social-wine text-[11px] font-bold">#5</p>
            <span className="border-social-wine font-display text-social-wine bg-avatar-wine-light flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[9px] font-extrabold">
              TU
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-social-wine text-[11px] font-bold">Vos</p>
              <p className="text-social-wine/65 text-[8px]">290 XP detrás del #4</p>
            </div>
            <p className="font-display text-social-wine text-[10px] font-extrabold">⚡ 1.250</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const CONTENT: Record<
  FeatureId,
  {
    eyebrow: string;
    eyebrowClass: string;
    title: string;
    body: string | string[];
    phone: React.ReactNode;
    note?: string | string[];
    live?: boolean;
  }
> = {
  signs: {
    eyebrow: "SEÑAS EN 3D",
    eyebrowClass: "text-primary",
    title: "Mirá cada seña en 3D, desde el ángulo que quieras.",
    body: "Lisa hace la seña y vos descubrís qué significa. Las lecciones son cortas y cada una mezcla ejercicios distintos. A veces elegís el significado, otras buscás la seña correcta, y también vas a unir pares y responder en contexto.",
    phone: <SignsPhone />,
    live: true,
  },
  camera: {
    eyebrow: "TU CÁMARA TE CORRIGE",
    eyebrowClass: "text-course-teal",
    title: "Hacé la seña y Signa te dice si te salió.",
    body: "La cámara sigue tus manos en tiempo real y mira más de 200 medidas de tu mano y de dónde está respecto de tu cara. Probalo ahora mismo escribiendo tu nombre y haciendo cada letra frente a la cámara.",
    note: [
      "El reconocimiento todavía está aprendiendo y a veces se equivoca. Lo seguimos revisando y mejorando.",
      "Todo pasa en tu dispositivo y ningún video sale de tu navegador.",
    ],
    phone: <CameraPhone />,
    live: true,
  },
  streak: {
    eyebrow: "UN RATITO POR DÍA",
    eyebrowClass: "text-shop-amber",
    title: "Aprendé un poco cada día y mirá cómo crece tu racha.",
    body: "Cada lección te suma XP, tu racha crece y vas desbloqueando logros y desafíos diarios y semanales. Si un día no podés, un protector de racha la cuida por vos. Y si te gusta competir, hay rankings con todo el mundo y con tus amigos.",
    phone: <StreakPhone />,
  },
  social: {
    eyebrow: "APRENDÉ CON AMIGOS",
    eyebrowClass: "text-social-wine",
    title: "Sumá a tus amigos y avancen juntos.",
    body: "Mirá cómo vienen tus amigos, qué señas aprendieron y cuántos días llevan de racha. Desde la tienda les podés regalar gemas o un protector de racha, y cada semana un ranking muestra quién va adelante.",
    phone: <SocialPhone />,
  },
};

export function FeaturePreview({ feature, closing }: { feature: FeatureId; closing?: boolean }) {
  const { closeFeature } = useLandingUI();
  const content = CONTENT[feature];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-preview-title"
      onClick={(e) => e.target === e.currentTarget && closeFeature()}
      className={cn(
        "bg-text/55 fixed inset-0 z-50 overflow-y-auto p-3 backdrop-blur-sm sm:p-5",
        closing ? "landing-modal-out pointer-events-none" : "landing-modal-in",
      )}
    >
      <div
        className={cn(
          "bg-background relative mx-auto my-auto grid grid-cols-1 items-center gap-10 rounded-[40px] p-6 pt-16",
          content.live
            ? "max-w-5xl md:grid-cols-[minmax(0,1fr)_380px] md:p-12"
            : "max-w-3xl sm:grid-cols-[minmax(0,1fr)_300px] sm:p-14",
          closing ? "landing-modal-card-out" : "landing-modal-card",
        )}
      >
        <CloseButton
          onClick={closeFeature}
          className="absolute top-5 right-5 sm:top-6 sm:right-6"
        />
        <div className={cn("flex flex-col gap-4", content.note && "md:self-stretch")}>
          <div className={cn("flex flex-col gap-4", content.note && "md:my-auto")}>
            <p className={`text-sm font-extrabold tracking-[2px] ${content.eyebrowClass}`}>
              {content.eyebrow}
            </p>
            <h3
              id="feature-preview-title"
              className="font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl"
            >
              {content.title}
            </h3>
            {[content.body].flat().map((paragraph) => (
              <p key={paragraph} className="text-text-muted text-[17px] leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          {content.note && (
            <p className="bg-fill text-text-muted flex gap-2.5 rounded-2xl px-4 py-3 text-sm leading-relaxed">
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="mt-0.5 shrink-0"
              >
                <circle cx="12" cy="12" r="9.5" />
                <path d="M12 11v6M12 7.5v.5" />
              </svg>
              <span className="flex flex-col gap-0.5">
                {[content.note].flat().map((paragraph) => (
                  <span key={paragraph}>{paragraph}</span>
                ))}
              </span>
            </p>
          )}
        </div>
        {content.phone}
      </div>
    </div>
  );
}
