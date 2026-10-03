"use client";

import { FeatureId, useLandingUI } from "@/components/landing/landing-ui-context";
import { CloseButton } from "@/components/landing/close-button";
import { LessonDemo } from "@/components/landing/lesson-demo";
import { LottiePlayer } from "@/components/landing/lottie-player";

function SignsPhone() {
  return (
    <div className="justify-self-center pb-6">
      <div className="relative">
        {/* Outer pulsing ring */}
        <div
          aria-hidden
          className="landing-phone-ring2 bg-primary/15 absolute -inset-8 rounded-[58px]"
        />
        {/* Inner pulsing ring */}
        <div
          aria-hidden
          className="landing-phone-ring bg-primary/30 absolute -inset-5 rounded-[54px]"
        />
        <div className="bg-text hover:ring-primary/30 relative rounded-[46px] p-2.5 shadow-2xl ring-4 ring-white/10 transition-shadow">
          <LessonDemo className="h-[620px] w-[280px] overflow-hidden rounded-[37px]" />
        </div>
        {/* Racha badge — bottom center of phone */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="bg-surface landing-floaty flex items-center gap-2 rounded-full py-2.5 pr-4 pl-2.5 text-sm font-bold shadow-xl">
            <span className="bg-shop-amber-light text-streak-orange flex h-7.5 w-7.5 items-center justify-center rounded-full">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
      {/* mirrors AchievementCelebrationScreen (signa-mobile) for a streak achievement */}
      <div
        className="flex h-[620px] w-[280px] flex-col overflow-hidden rounded-[37px] px-5 pt-10 pb-6"
        style={{ backgroundColor: "#FDA55A" }}
      >
        {/* streak-fire Lottie — same file used in signa-mobile */}
        <div className="flex flex-1 items-center justify-center">
          <LottiePlayer
            src="/animations/streak-fire.json"
            className="h-[220px] w-[160px]"
          />
        </div>

        {/* headline + subtitle */}
        <div className="text-center">
          <p className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-white">
            ¡Llegaste a 7 días de racha!
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-white/80">
            Seguís aprendiendo todos los días. ¡Así se hace!
          </p>
        </div>

        {/* reward card */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3.5">
          {/* silver medal Lottie — same file used in signa-mobile (tier "silver" = 7 days) */}
          <LottiePlayer
            src="/animations/medals/silver.json"
            className="h-[60px] w-[60px] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-text-muted text-[10.5px] font-semibold">Logro desbloqueado</p>
            <p className="font-display text-[14px] font-bold leading-tight">Primera semana</p>
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

        {/* button */}
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
        {/* Wine header */}
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

        {/* Segmented control */}
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

        {/* Ranking content */}
        <div className="flex flex-1 flex-col overflow-hidden px-2.5 pt-2">
          {/* Scope toggle */}
          <div className="bg-fill flex rounded-[10px] p-0.5 text-[9.5px] font-bold">
            <div className="bg-surface text-social-wine flex-1 rounded-[8px] py-1.5 text-center shadow-sm">
              Global (98)
            </div>
            <div className="text-text-muted flex-1 py-1.5 text-center">Mis amigos (8)</div>
          </div>

          {/* Countdown */}
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

          {/* Section label */}
          <p className="text-text-muted mt-1.5 text-[8px] font-bold tracking-[0.6px]">
            XP DE ESTA SEMANA
          </p>

          {/* Podium */}
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

          {/* List rows */}
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

          {/* Sticky me bar */}
          <div className="border-social-wine/40 bg-avatar-wine-light mt-auto -mx-2.5 flex items-center gap-2 border-t px-3.5 py-2">
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
    body: "Signa tiene vidas, racha, gemas, logros, desafíos diarios y semanales. Cada lección suma XP y hay rankings globales y entre tus amigos para ver quién lidera.",
    phone: <StreakPhone />,
  },
  social: {
    eyebrow: "APRENDÉ CON AMIGOS",
    eyebrowClass: "text-social-wine",
    title: "Agregá amigos y compartan el progreso.",
    body: "Ves el avance de tus amigos, las señas que aprendieron y cuántos días llevan de racha. Podés regalarles protectores de racha, gemas y más desde la tienda. Un ranking semanal te muestra quién está liderando.",
    phone: <SocialPhone />,
  },
};

export function FeaturePreview({ feature }: { feature: FeatureId }) {
  const { closeFeature } = useLandingUI();
  const content = CONTENT[feature];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-preview-title"
      onClick={(e) => e.target === e.currentTarget && closeFeature()}
      className="landing-modal-in bg-text/55 fixed inset-0 z-50 overflow-y-auto p-3 backdrop-blur-sm sm:p-5"
    >
      <div className="landing-modal-card bg-background relative mx-auto my-auto grid max-w-3xl grid-cols-1 items-center gap-10 rounded-[40px] p-6 pt-16 sm:grid-cols-[minmax(0,1fr)_300px] sm:p-14">
        <CloseButton
          onClick={closeFeature}
          className="absolute top-5 right-5 sm:top-6 sm:right-6"
        />
        <div className="flex flex-col gap-4">
          <p className={`text-sm font-extrabold tracking-[2px] ${content.eyebrowClass}`}>
            {content.eyebrow}
          </p>
          <h3
            id="feature-preview-title"
            className="font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl"
          >
            {content.title}
          </h3>
          <p className="text-text-muted text-[17px] leading-relaxed">{content.body}</p>
        </div>
        {content.phone}
      </div>
    </div>
  );
}
