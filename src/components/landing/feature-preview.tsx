"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FeatureId, useLandingUI } from "@/components/landing/landing-ui-context";
import { CloseButton } from "@/components/landing/close-button";
import { LessonDemo } from "@/components/landing/lesson-demo";
import { LottiePlayer } from "@/components/landing/lottie-player";
import { CameraNameDemo } from "@/components/landing/camera-name-demo";

const LIVE_SCREEN = "h-[760px] w-[360px] overflow-hidden rounded-[37px]";

const LIVE_PHONE = { w: 380, h: 780 };
const STATIC_PHONE = { w: 300, h: 640 };
const MAX_SCALE = 1.5;
const MOBILE_CHROME = 128;
const MODAL_OPEN_MS = 400;

function FitPhone({
  base,
  children,
  around,
}: {
  base: { w: number; h: number };
  children: ReactNode;
  around?: ReactNode;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = slot.current;
    if (!el) return;
    const screenHeight = window.innerHeight;
    const fit = () => {
      const { clientWidth, clientHeight } = el;
      const style = getComputedStyle(el);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const wide = window.matchMedia?.("(min-width: 768px)").matches ?? true;
      const h = wide ? clientHeight - padY : screenHeight - MOBILE_CHROME - padY;
      setScale(Math.max(0.3, Math.min(MAX_SCALE, (clientWidth - padX) / base.w, h / base.h)));
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [base.w, base.h]);

  return (
    <div
      ref={slot}
      className="flex w-full items-center justify-center p-5 md:h-full md:min-h-0 md:p-6"
    >
      <div
        data-phone
        className={cn("relative shrink-0", scale === 0 && "invisible")}
        style={{ width: base.w * scale, height: base.h * scale }}
      >
        {around}
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: base.w, height: base.h, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function LivePhone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-text h-full w-full rounded-[46px] p-2.5 shadow-2xl ring-4 ring-white/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SignsPhone() {
  return (
    <FitPhone base={LIVE_PHONE} around={<></>}>
      <LivePhone>
        <LessonDemo
          className={LIVE_SCREEN}
          viewerClassName="h-[440px]"
          viewerDelay={MODAL_OPEN_MS}
        />
      </LivePhone>
    </FitPhone>
  );
}

function CameraPhone() {
  return (
    <FitPhone base={LIVE_PHONE}>
      <LivePhone>
        <CameraNameDemo className={LIVE_SCREEN} />
      </LivePhone>
    </FitPhone>
  );
}

function StreakPhone() {
  return (
    <div className="bg-text rounded-[46px] p-2.5 shadow-2xl">
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
  const [tab, setTab] = useState<"feed" | "amigos" | "ranking">("ranking");
  const [scope, setScope] = useState<"global" | "friends">("global");
  const [liked, setLiked] = useState<ReadonlySet<number>>(new Set());
  const [amigosSub, setAmigosSub] = useState<"amigos" | "solicitudes">("amigos");

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

  type ListEntry = {
    rank: number;
    initials: string;
    name: string;
    streak: number;
    xp: string;
    delta: string;
    deltaClass: string;
    avatar: string;
    isYou?: boolean;
  };

  const GLOBAL_LIST: ListEntry[] = [
    {
      rank: 4,
      initials: "AL",
      name: "Ana L.",
      streak: 8,
      xp: "750",
      delta: "↑2",
      deltaClass: "bg-success-light text-success-dark",
      avatar: "bg-avatar-blue-light text-gems-blue-dark",
    },
    {
      rank: 5,
      initials: "CB",
      name: "Carlos B.",
      streak: 3,
      xp: "680",
      delta: "↓1",
      deltaClass: "bg-danger-light text-danger",
      avatar: "bg-avatar-teal-light text-avatar-teal-dark",
    },
    {
      rank: 6,
      initials: "LM",
      name: "Laura M.",
      streak: 5,
      xp: "540",
      delta: "—",
      deltaClass: "bg-fill text-text-muted",
      avatar: "bg-shop-amber-light text-shop-amber-dark",
    },
    {
      rank: 7,
      initials: "TU",
      name: "Vos",
      streak: 12,
      xp: "460",
      delta: "—",
      deltaClass: "bg-fill text-text-muted",
      avatar: "bg-avatar-wine-light text-social-wine",
      isYou: true,
    },
    {
      rank: 8,
      initials: "RG",
      name: "Ramón G.",
      streak: 1,
      xp: "390",
      delta: "↑3",
      deltaClass: "bg-success-light text-success-dark",
      avatar: "bg-primary-light text-primary-dark",
    },
  ];

  const FRIENDS_LIST: ListEntry[] = [
    {
      rank: 4,
      initials: "AL",
      name: "Ana L.",
      streak: 8,
      xp: "750",
      delta: "↑1",
      deltaClass: "bg-success-light text-success-dark",
      avatar: "bg-avatar-blue-light text-gems-blue-dark",
    },
    {
      rank: 5,
      initials: "TU",
      name: "Vos",
      streak: 12,
      xp: "460",
      delta: "—",
      deltaClass: "bg-fill text-text-muted",
      avatar: "bg-avatar-wine-light text-social-wine",
      isYou: true,
    },
  ];

  const FEED = [
    {
      id: 0,
      initials: "MR",
      name: "Mati R.",
      avatarClass: "bg-avatar-teal-light text-avatar-teal-dark",
      time: "hace 1h",
      pre: "Completó la lección",
      highlight: "Saludos básicos",
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
      iconChar: "✓",
    },
    {
      id: 1,
      initials: "SG",
      name: "Sofía G.",
      avatarClass: "bg-primary-light text-primary-dark",
      time: "hace 3h",
      pre: "Desbloqueó el logro",
      highlight: "Primera semana ★",
      iconBg: "bg-shop-amber-light",
      iconColor: "text-shop-amber",
      iconChar: "★",
    },
    {
      id: 2,
      initials: "JP",
      name: "Juan P.",
      avatarClass: "bg-shop-amber-light text-shop-amber-dark",
      time: "hace 5h",
      pre: "Llegó a",
      highlight: "10 días de racha 🔥",
      iconBg: "bg-[#FDA55A]/20",
      iconColor: "",
      iconChar: "🔥",
    },
  ];

  const AMIGOS_LIST = [
    {
      initials: "MR",
      name: "Matías R.",
      handle: "@mati",
      streak: "21",
      xp: "8.4k",
      avatar: "bg-avatar-teal-light text-avatar-teal-dark",
    },
    {
      initials: "SG",
      name: "Sofía G.",
      handle: "@sofi",
      streak: "14",
      xp: "5.7k",
      avatar: "bg-primary-light text-primary-dark",
    },
    {
      initials: "JP",
      name: "Juan P.",
      handle: "@juanp",
      streak: "10",
      xp: "3.2k",
      avatar: "bg-shop-amber-light text-shop-amber-dark",
    },
    {
      initials: "AL",
      name: "Ana L.",
      handle: "@anal",
      streak: "8",
      xp: "2.9k",
      avatar: "bg-avatar-blue-light text-gems-blue-dark",
    },
  ];

  const SOLICITUDES = [
    {
      initials: "VR",
      name: "Valentina R.",
      handle: "@vale",
      mutual: "3 amigos en común",
      avatar: "bg-avatar-green-light text-avatar-teal-dark",
    },
    {
      initials: "PG",
      name: "Pablo G.",
      handle: "@pablog",
      mutual: "1 amigo en común",
      avatar: "bg-primary-light text-primary-dark",
    },
  ];

  const currentList = scope === "global" ? GLOBAL_LIST : FRIENDS_LIST;
  const meRank = scope === "global" ? 7 : 5;
  const meGap = scope === "global" ? "220 XP detrás del #6" : "290 XP detrás del #4";

  const TABS: { key: "feed" | "amigos" | "ranking"; label: string; badge?: number }[] = [
    { key: "feed", label: "Feed" },
    { key: "amigos", label: "Amigos", badge: 2 },
    { key: "ranking", label: "Ranking" },
  ];

  return (
    <div className="bg-text rounded-[46px] p-2.5 shadow-2xl">
      <div className="bg-background flex h-[620px] w-[280px] flex-col overflow-hidden rounded-[37px]">
        {/* Header — matches ScreenHeader with stats strip */}
        <div className="bg-social-wine relative shrink-0 overflow-hidden px-4 pt-7 pb-4 text-white">
          <div
            aria-hidden
            className="absolute -top-16 -right-10 h-[200px] w-[200px] rounded-full bg-white/9"
          />
          <p className="font-display relative text-2xl leading-none font-bold tracking-tight">
            Social
          </p>
          <p className="relative mt-1.5 text-[10.5px] leading-snug opacity-88">
            Mirá qué están logrando tus amigos y sumá los tuyos.
          </p>
          {/* Stats strip: vertical layout — label above, icon + value below */}
          <div className="relative mt-3 flex gap-2">
            <div className="flex flex-1 flex-col rounded-2xl bg-white/16 px-2.5 py-2">
              <p className="text-[7px] font-semibold tracking-[0.8px] opacity-75">AMIGOS</p>
              <div className="mt-1 flex items-center gap-1">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-[13px] w-[13px] shrink-0"
                >
                  <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
                <p className="font-display text-[18px] leading-none font-bold">8</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col rounded-2xl bg-white/16 px-2.5 py-2">
              <p className="text-[7px] font-semibold tracking-[0.8px] opacity-75">SOLICITUDES</p>
              <div className="mt-1 flex items-center gap-1">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-[13px] w-[13px] shrink-0"
                >
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <p className="font-display text-[18px] leading-none font-bold">2</p>
              </div>
            </div>
          </div>
        </div>

        {/* SegmentedControl — pill style, dark active */}
        <div className="flex shrink-0 gap-1.5 px-2.5 pt-2.5 pb-2">
          {TABS.map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-[10px] py-[9px] text-[10.5px] font-semibold",
                tab === key ? "bg-text text-on-dark" : "bg-fill text-text-muted",
              )}
            >
              {label}
              {!!badge && (
                <span
                  className={cn(
                    "rounded-[5px] px-1 py-px text-[9px] leading-none font-bold",
                    tab === key ? "text-on-dark bg-white/20" : "bg-text text-on-dark",
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ranking */}
        {tab === "ranking" && (
          <div className="flex flex-1 flex-col overflow-hidden px-2.5 pt-1">
            {/* Scope toggle — matches SubTabs/RankingTab style */}
            <div className="bg-fill flex shrink-0 rounded-[14px] p-1 text-[9.5px] font-semibold">
              <button
                onClick={() => setScope("global")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-[11px] py-[7px]",
                  scope === "global" ? "bg-surface text-text shadow-sm" : "text-text-muted",
                )}
              >
                Global
                <span
                  className={cn(
                    "font-bold opacity-70",
                    scope === "global" ? "text-text" : "text-text-muted",
                  )}
                >
                  98
                </span>
              </button>
              <button
                onClick={() => setScope("friends")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-[11px] py-[7px]",
                  scope === "friends" ? "bg-surface text-text shadow-sm" : "text-text-muted",
                )}
              >
                Mis amigos
                <span
                  className={cn(
                    "font-bold opacity-70",
                    scope === "friends" ? "text-text" : "text-text-muted",
                  )}
                >
                  8
                </span>
              </button>
            </div>

            <div className="border-border bg-surface mt-1.5 flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5">
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
              <p className="text-text-muted flex-1 text-[8.5px]">
                Se reinicia el lunes a las 00:00
              </p>
              <p className="font-display text-[10px] font-bold">2d 14:22</p>
            </div>

            <p className="text-text-muted mt-1.5 shrink-0 text-[8px] font-semibold tracking-[0.6px]">
              XP DE ESTA SEMANA
            </p>

            <div className="border-border bg-surface mt-1 flex shrink-0 items-end justify-around overflow-hidden rounded-[18px] border px-2 pt-2">
              {PODIUM.map((p) => (
                <div key={p.rank} className="flex flex-col items-center gap-0.5">
                  <div
                    className={cn(
                      "font-display flex shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ring-2",
                      p.avatar,
                      p.size,
                      p.ring,
                    )}
                  >
                    {p.initials}
                  </div>
                  <div className="bg-social-wine rounded-full px-1.5 py-px text-[7px] font-extrabold text-white">
                    #{p.rank}
                  </div>
                  <p className="text-[8.5px] font-semibold">{p.firstName}</p>
                  <p className="text-text-muted text-[7.5px]">⚡ {p.xp}</p>
                  <div className={cn("w-full rounded-t-[8px]", p.bar, p.barH)} />
                </div>
              ))}
            </div>

            <div className="mt-1.5 flex-1 overflow-y-auto">
              <div className="border-border bg-surface overflow-hidden rounded-[18px] border">
                {currentList.map((r, i) => (
                  <div
                    key={r.rank}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2",
                      i < currentList.length - 1 && "border-border border-b",
                      r.isYou && "bg-avatar-wine-light",
                    )}
                  >
                    <p className="text-text-muted font-display w-3.5 text-right text-[9.5px] font-bold">
                      #{r.rank}
                    </p>
                    <span
                      className={cn(
                        "font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold",
                        r.avatar,
                      )}
                    >
                      {r.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[11px] font-bold">{r.name}</p>
                      <p className="text-text-muted text-[8px]">🔥 {r.streak} días</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={cn(
                          "rounded-[5px] px-1 py-px text-[7px] font-bold",
                          r.deltaClass,
                        )}
                      >
                        {r.delta}
                      </span>
                      <p className="font-display text-[9.5px] font-extrabold">⚡ {r.xp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Me bar — border-border, not wine */}
            <div className="border-border bg-avatar-wine-light -mx-2.5 mt-auto flex shrink-0 items-center gap-2 border-t px-3.5 py-2">
              <p className="font-display text-social-wine text-[11px] font-bold">#{meRank}</p>
              <span className="border-social-wine font-display text-social-wine bg-avatar-wine-light flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[9px] font-extrabold">
                TU
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-social-wine text-[11px] font-bold">Vos</p>
                <p className="text-social-wine text-[8px]">{meGap}</p>
              </div>
              <p className="font-display text-social-wine text-[10px] font-extrabold">⚡ 460</p>
            </div>
          </div>
        )}

        {/* Feed */}
        {tab === "feed" && (
          <div className="flex-1 overflow-y-auto px-2.5 pt-1.5 pb-2">
            <p className="text-text-muted mb-2 text-[8px] font-semibold tracking-[0.6px]">
              ACTIVIDAD RECIENTE
            </p>
            <div className="flex flex-col gap-2">
              {FEED.map((item) => (
                <div key={item.id} className="border-border bg-surface rounded-[18px] border p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-display flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold",
                        item.avatarClass,
                      )}
                    >
                      {item.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[11px] font-semibold">{item.name}</p>
                      <p className="text-text-muted text-[8px]">{item.time}</p>
                    </div>
                    <div
                      className={cn(
                        "flex h-[30px] w-[30px] items-center justify-center rounded-[10px] text-[14px]",
                        item.iconBg,
                      )}
                    >
                      <span className={item.iconColor}>{item.iconChar}</span>
                    </div>
                  </div>
                  <p className="text-text-muted mt-2 text-[10.5px] leading-snug">
                    {item.pre} <span className="text-text font-bold">{item.highlight}</span>
                  </p>
                  <div className="border-border mt-2 border-t pt-2">
                    <button
                      onClick={() =>
                        setLiked((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        })
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[9px] font-semibold",
                        liked.has(item.id)
                          ? "bg-avatar-wine-light text-social-wine"
                          : "bg-fill text-text-muted",
                      )}
                    >
                      <span>{liked.has(item.id) ? "♥" : "♡"}</span>
                      Me gusta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amigos */}
        {tab === "amigos" && (
          <div className="flex-1 overflow-y-auto px-2.5 pt-1.5">
            {/* Search bar */}
            <div className="border-border bg-surface mb-2 flex items-center gap-1.5 rounded-[14px] border px-2.5 py-2">
              <svg
                aria-hidden="true"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-muted shrink-0"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p className="text-text-muted flex-1 text-[9px]">Buscar por nombre o usuario</p>
            </div>
            {/* SubTabs — Mis amigos / Solicitudes */}
            <div className="bg-fill mb-2 flex rounded-[14px] p-1 text-[9.5px] font-semibold">
              <button
                onClick={() => setAmigosSub("amigos")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-[11px] py-[7px]",
                  amigosSub === "amigos" ? "bg-surface text-text shadow-sm" : "text-text-muted",
                )}
              >
                Mis amigos
                <span
                  className={cn(
                    "font-bold opacity-70",
                    amigosSub === "amigos" ? "text-text" : "text-text-muted",
                  )}
                >
                  4
                </span>
              </button>
              <button
                onClick={() => setAmigosSub("solicitudes")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-[11px] py-[7px]",
                  amigosSub === "solicitudes"
                    ? "bg-surface text-text shadow-sm"
                    : "text-text-muted",
                )}
              >
                Solicitudes
                <span
                  className={cn(
                    "font-bold opacity-70",
                    amigosSub === "solicitudes" ? "text-text" : "text-text-muted",
                  )}
                >
                  2
                </span>
              </button>
            </div>
            {/* Friends list */}
            {amigosSub === "amigos" && (
              <div className="border-border bg-surface overflow-hidden rounded-[18px] border">
                {AMIGOS_LIST.map((friend, i) => (
                  <div
                    key={friend.initials}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2.5",
                      i < AMIGOS_LIST.length - 1 && "border-border border-b",
                    )}
                  >
                    <span
                      className={cn(
                        "font-display flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold",
                        friend.avatar,
                      )}
                    >
                      {friend.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[11px] font-semibold">{friend.name}</p>
                      <p className="text-text-muted text-[8px]">{friend.handle}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[8px]">
                      <span className="text-text-muted">🔥{friend.streak}</span>
                      <span className="font-display font-bold">⚡{friend.xp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Solicitudes */}
            {amigosSub === "solicitudes" && (
              <div className="border-border bg-surface overflow-hidden rounded-[18px] border">
                {SOLICITUDES.map((req, i) => (
                  <div
                    key={req.initials}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2.5",
                      i < SOLICITUDES.length - 1 && "border-border border-b",
                    )}
                  >
                    <span
                      className={cn(
                        "font-display flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold",
                        req.avatar,
                      )}
                    >
                      {req.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[11px] font-semibold">{req.name}</p>
                      <p className="text-text-muted text-[8px]">{req.mutual}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="bg-social-wine rounded-[8px] px-2 py-1 text-[8px] font-bold text-white">
                        ✓
                      </button>
                      <button className="bg-fill text-text-muted rounded-[8px] px-2 py-1 text-[8px] font-bold">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
      "Todo pasa en tu dispositivo y ningún video sale de tu navegador, así que en equipos más viejos puede ir un poco más lento.",
    ],
    phone: <CameraPhone />,
    live: true,
  },
  streak: {
    eyebrow: "UN RATITO POR DÍA",
    eyebrowClass: "text-shop-amber",
    title: "Aprendé un poco cada día y mirá cómo crece tu racha.",
    body: "Cada lección te suma XP, tu racha crece y vas desbloqueando logros y desafíos diarios y semanales. Si un día no podés, un protector de racha la cuida por vos. Y si te gusta competir, hay rankings con todo el mundo y con tus amigos.",
    phone: (
      <FitPhone base={STATIC_PHONE}>
        <StreakPhone />
      </FitPhone>
    ),
  },
  social: {
    eyebrow: "APRENDÉ CON AMIGOS",
    eyebrowClass: "text-social-wine",
    title: "Sumá a tus amigos y avancen juntos.",
    body: "Mirá cómo vienen tus amigos, qué señas aprendieron y cuántos días llevan de racha. Desde la tienda les podés regalar gemas o un protector de racha, y cada semana un ranking muestra quién va adelante.",
    phone: (
      <FitPhone base={STATIC_PHONE}>
        <SocialPhone />
      </FitPhone>
    ),
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
        "bg-text/55 fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-sm sm:p-6 lg:p-8",
        closing ? "landing-modal-out pointer-events-none" : "landing-modal-in",
      )}
    >
      <div
        className={cn(
          "bg-background relative grid h-full max-h-[960px] w-full max-w-[1280px] grid-cols-1 items-center gap-6 overflow-y-auto overscroll-contain rounded-[40px] p-6 pt-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10 md:px-12 md:py-8 lg:px-16",
          closing ? "landing-modal-card-out" : "landing-modal-card",
        )}
      >
        <CloseButton
          onClick={closeFeature}
          className="absolute top-5 right-5 sm:top-6 sm:right-6"
        />
        <div className="flex max-w-xl flex-col gap-4">
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
            {[content.body].flat().map((paragraph) => (
              <p key={paragraph} className="text-text-muted text-[17px] leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          {content.note && (
            <p className="bg-fill text-text-muted mt-4 flex gap-2.5 rounded-2xl px-4 py-3 text-sm leading-relaxed">
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
