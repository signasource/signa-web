import Image from "next/image";
import Link from "next/link";
import { CardRail } from "@/components/landing/card-rail";
import { OrgTrigger } from "@/components/landing/org-trigger";

const CARDS = [
  {
    icon: "/icons/heart.svg",
    title: "Familia y amistades",
    body: "Para comunicarte mejor con una persona sorda que forma parte de tu vida.",
    className: "bg-accent-coral text-text",
    cta: { kind: "link", href: "#probar", label: "Probá tu primera seña" },
  },
  {
    icon: "/icons/analitics.svg",
    title: "Trabajo",
    body: "Para atender mejor en salud, educación o atención al público, con cursos pensados para cada área.",
    className: "bg-accent-amber text-text",
    cta: { kind: "org", label: "Cursos para tu equipo" },
  },
  {
    icon: "/icons/idea.svg",
    title: "Curiosidad",
    body: "Para quien siempre quiso aprender una lengua nueva. Esta se aprende con las manos y los ojos.",
    className: "bg-accent-teal text-text",
    cta: { kind: "link", href: "#empezar", label: "Empezá gratis" },
  },
  {
    icon: "/icons/hands-give.svg",
    title: "Inclusión",
    body: "Para construir espacios donde la comunidad sorda también pueda participar.",
    className: "bg-accent-violet text-on-primary",
    cta: { kind: "org", label: "Signa para organizaciones" },
  },
] as const;

const ctaClass =
  "landing-btn mt-2 flex min-h-12 items-center gap-2 self-start rounded-full bg-white/30 px-5 text-[15px] font-extrabold hover:bg-white/45";

export function ParaQuien() {
  return (
    <section aria-labelledby="para-quien-t" className="py-20 sm:py-28">
      <div className="mx-auto mb-12 grid max-w-6xl grid-cols-1 gap-5 px-5 sm:px-8 md:grid-cols-2 md:items-end">
        <div className="flex flex-col gap-5">
          <p className="text-primary text-sm font-extrabold tracking-[2px]">PARA QUIÉN ES</p>
          <h2
            id="para-quien-t"
            data-reveal="up"
            className="font-display text-5xl leading-none font-extrabold tracking-tight text-balance sm:text-6xl"
          >
            Para cualquiera que quiera empezar en LSA.
          </h2>
        </div>
        <p data-reveal="up" className="text-text-muted max-w-md text-lg leading-relaxed">
          Desde cero, con algo de base o para repasar. Al entrar, Signa te pregunta tu nivel y por
          qué querés aprender, y arma el camino con vos.
        </p>
      </div>

      <CardRail label="Para quién es Signa">
        {CARDS.map((card) => (
          <article
            key={card.title}
            data-rail-item
            className={`landing-card-click group flex min-h-[440px] w-[82vw] max-w-[400px] shrink-0 snap-start flex-col gap-4 rounded-[36px] p-8 sm:min-h-[500px] sm:p-9 ${card.className}`}
          >
            <Image
              src={card.icon}
              alt=""
              aria-hidden
              width={80}
              height={80}
              draggable={false}
              className="h-20 w-20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
            />
            <h3 className="font-display mt-auto text-4xl leading-none font-extrabold tracking-tight">
              {card.title}
            </h3>
            <p className="text-lg leading-snug">{card.body}</p>
            {card.cta.kind === "link" ? (
              <Link href={card.cta.href} className={ctaClass}>
                {card.cta.label}
                <Arrow />
              </Link>
            ) : (
              <OrgTrigger className={ctaClass}>
                {card.cta.label}
                <Arrow />
              </OrgTrigger>
            )}
          </article>
        ))}
      </CardRail>
    </section>
  );
}

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
