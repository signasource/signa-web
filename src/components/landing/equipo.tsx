import type { CSSProperties } from "react";
import Image from "next/image";

const MEMBERS = [
  { name: "Agostina Avalle", photo: "/images/equipo/agostina-v2.png", objectPosition: "top" },
  { name: "Paloma Córcoba", photo: "/images/equipo/paloma-v2.png", objectPosition: "top" },
  { name: "Juan Cruz López Freytas", photo: "/images/equipo/juancruz-v2.png", objectPosition: "center" },
  { name: "Joaquín Miranda", photo: "/images/equipo/joaquin-v2.png", objectPosition: "top" },
  { name: "Mateo Ottonello", photo: "/images/equipo/mateo-v2.png", objectPosition: "top" },
  { name: "Marina Polunosik", photo: "/images/equipo/marina-v2.png", objectPosition: "center" },
];

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

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {MEMBERS.map((member, i) => (
            <div
              key={member.name}
              data-reveal="up"
              style={{ "--delay": `${i * 60}ms` } as CSSProperties}
              className="flex flex-col items-center gap-3"
            >
              <div
                className={`bg-primary/8 aspect-square w-full overflow-hidden rounded-[24px] ${
                  i % 2 === 0 ? "landing-team-card" : "landing-team-card landing-team-card-alt"
                }`}
              >
                <Image
                  src={member.photo}
                  alt={member.name}
                  width={600}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: member.objectPosition }}
                />
              </div>
              <p className="text-sm font-bold leading-tight text-center">{member.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
