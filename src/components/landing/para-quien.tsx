import Image from "next/image";

const CARDS = [
  {
    icon: "/icons/heart.svg",
    title: "Familia y amistades",
    body: "Para comunicarte mejor con una persona sorda que forma parte de tu vida.",
    className: "bg-accent-coral text-text",
  },
  {
    icon: "/icons/analitics.svg",
    title: "Trabajo",
    body: "Para atender mejor en salud, educación o atención al público, con cursos pensados para cada área.",
    className: "bg-accent-amber text-text",
  },
  {
    icon: "/icons/idea.svg",
    title: "Curiosidad",
    body: "Para quien siempre quiso aprender una lengua nueva. Esta se aprende con las manos y los ojos.",
    className: "bg-accent-teal text-text",
  },
  {
    icon: "/icons/hands-give.svg",
    title: "Inclusión",
    body: "Para construir espacios donde la comunidad sorda también pueda participar.",
    className: "bg-accent-violet text-on-primary",
  },
] as const;

/** Horizontal pinned scroll — see landing.css `--hz` view-timeline. */
export function ParaQuien() {
  return (
    <section aria-labelledby="para-quien-t" className="landing-hz relative h-[2300px]">
      <div className="landing-hz-pin sticky top-0 flex h-[900px] flex-col justify-center gap-12 overflow-hidden">
        <div
          className="landing-hz-track flex items-stretch gap-6 pl-8"
          style={{ width: "max-content" }}
        >
          <div className="flex w-[520px] flex-col justify-center gap-5 pr-10">
            <p className="text-primary text-sm font-extrabold tracking-[2px]">PARA QUIÉN ES</p>
            <h2
              id="para-quien-t"
              className="font-display text-6xl leading-none font-extrabold tracking-tight"
            >
              Para cualquiera que quiera empezar en LSA.
            </h2>
            <p className="text-text-muted text-lg leading-relaxed">
              Desde cero, con algo de base o para repasar. Al entrar, Signa te pregunta tu nivel y
              por qué querés aprender, y arma el camino con vos.
            </p>
          </div>
          {CARDS.map((card, i) => (
            <div
              key={card.title}
              className={`flex min-h-[520px] w-[400px] flex-col gap-4 rounded-[36px] p-9 ${card.className} ${i === CARDS.length - 1 ? "mr-16" : ""}`}
            >
              <Image
                src={card.icon}
                alt=""
                aria-hidden
                width={80}
                height={80}
                className="h-20 w-20"
              />
              <p className="font-display mt-auto text-4xl leading-none font-extrabold tracking-tight">
                {card.title}
              </p>
              <p className="text-lg leading-snug">{card.body}</p>
            </div>
          ))}
        </div>
        <div className="landing-hz-bar-wrap bg-border mx-16 h-1 overflow-hidden rounded-full">
          <div className="landing-hz-bar bg-text h-1 origin-left" />
        </div>
      </div>
    </section>
  );
}
