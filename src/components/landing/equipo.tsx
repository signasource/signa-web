import type { CSSProperties } from "react";

const TEAM = [
  { initials: "PC", name: "Paloma Corcoba", className: "bg-primary-light text-primary-dark" },
  {
    initials: "JM",
    name: "Joaquín Miranda",
    className: "bg-avatar-teal-light text-avatar-teal-dark",
  },
  {
    initials: "JL",
    name: "Juan Cruz López Freytas",
    className: "bg-avatar-wine-light text-social-wine",
  },
  {
    initials: "MP",
    name: "Marina Polunosik",
    className: "bg-shop-amber-light text-shop-amber-dark",
  },
  {
    initials: "MO",
    name: "Mateo Ottonello",
    className: "bg-avatar-blue-light text-gems-blue-dark",
  },
  { initials: "AA", name: "Agostina Avalle", className: "bg-avatar-green-light text-success-dark" },
] as const;

export function Equipo() {
  return (
    <section id="equipo" className="bg-fill rounded-t-[48px] px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 md:items-end">
          <div className="flex flex-col gap-5">
            <p className="text-primary text-sm font-extrabold tracking-[2px]">QUIÉNES SOMOS</p>
            <h2
              data-reveal="up"
              className="font-display text-5xl leading-none font-extrabold tracking-tight text-balance sm:text-6xl"
            >
              Seis estudiantes, un proyecto final.
            </h2>
          </div>
          <div data-reveal="up" className="flex flex-col gap-4">
            <p className="text-text-muted text-lg leading-relaxed">
              Somos el equipo detrás de Signa: estudiantes de Ingeniería en Sistemas de Información
              de la Universidad Tecnológica Nacional, Facultad Regional Córdoba. Signa es nuestro
              Proyecto Final, la tesis con la que cerramos la carrera.
            </p>
            <div className="flex flex-wrap gap-2">
              {["UTN · FRC", "Ingeniería en Sistemas de Información", "Proyecto Final"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="border-border bg-surface rounded-full border px-3.5 py-2 text-sm font-bold"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {TEAM.map((member, i) => (
            <li
              key={member.name}
              data-reveal={i % 2 === 0 ? "tilt-a" : "tilt-b"}
              style={{ "--delay": `${(i % 3) * 80}ms` } as CSSProperties}
            >
              <div className="landing-card-click group bg-surface flex h-full flex-col items-center gap-3.5 rounded-3xl p-6 text-center">
                <div
                  className={`font-display flex h-[88px] w-[88px] items-center justify-center rounded-full text-3xl font-extrabold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${member.className}`}
                >
                  {member.initials}
                </div>
                <p className="font-display text-lg leading-tight font-bold">{member.name}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
