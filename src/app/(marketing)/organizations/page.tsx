import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { LandingUIProvider } from "@/components/landing/landing-ui-provider";
import { Nav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import "@/app/(marketing)/landing.css";

export const metadata: Metadata = {
  title: "Signa para organizaciones",
  alternates: { canonical: "/organizations" },
};

const STEPS = [
  {
    title: "Elegí el curso",
    body: "Salud, atención al cliente, educación u otro curso temático.",
  },
  {
    title: "Definí el grupo",
    body: "Abonás un monto por el conjunto de personas que va a hacer el curso.",
  },
  {
    title: "Cada quien, en su cuenta",
    body: "Tus empleados acceden al curso gratis desde su cuenta individual, junto con el curso básico.",
  },
  {
    title: "Seguí el avance",
    body: "Un panel simple: quién empezó, cuánto avanzó y quién necesita un recordatorio.",
  },
] as const;

/** Real captures of the organization panel (example data), newest panel first. */
/** All captures are 2000×1194 (a 1440 px wide panel at 2×, resized). */
const SHOT_SIZE = { width: 2000, height: 1194 } as const;

const PANEL_SHOTS: { src: string; title: string; body: string; alt: string }[] = [
  {
    src: "/images/panel/resumen.webp",
    title: "Resumen",
    body: "Las invitaciones pendientes, el progreso promedio y quién necesita seguimiento, con un recordatorio a un clic.",
    alt: "Panel de Signa, pestaña Resumen: 6 invitaciones pendientes, progreso promedio de 31%, una persona que requiere seguimiento y la lista de participantes activos.",
  },
  {
    src: "/images/panel/participantes.webp",
    title: "Participantes",
    body: "El estado y el avance de cada persona, con filtros por curso y fecha y orden por columna.",
    alt: "Panel de Signa, pestaña Participantes: tabla con nueve personas, su estado (activo o inactivo), barra de avance, última vez que entraron y fecha de incorporación.",
  },
  {
    src: "/images/panel/compra.webp",
    title: "Compras",
    body: "Cada compra con sus cupos, quién aceptó la invitación y cuánto avanzó, junto al resumen del pago.",
    alt: "Panel de Signa, detalle de una compra: 2 personas completaron, progreso promedio de 42%, tasa de finalización de 20%, la lista de personas invitadas y el resumen de la compra.",
  },
];

function PanelShot({
  shot,
  priority = false,
  sizes,
}: {
  shot: (typeof PANEL_SHOTS)[number];
  priority?: boolean;
  sizes: string;
}) {
  return (
    <figure className="flex flex-col gap-4">
      <div className="bg-background overflow-hidden rounded-[20px] shadow-2xl ring-1 ring-white/10 sm:rounded-[28px]">
        <Image
          src={shot.src}
          alt={shot.alt}
          {...SHOT_SIZE}
          sizes={sizes}
          priority={priority}
          className="h-auto w-full"
        />
      </div>
      <figcaption className="flex flex-col gap-1 px-1">
        <span className="font-display text-xl font-bold tracking-tight">{shot.title}</span>
        <span className="text-on-dark/65 text-base leading-relaxed">{shot.body}</span>
      </figcaption>
    </figure>
  );
}

export default function OrganizacionesPage() {
  return (
    <LandingUIProvider>
      <div className="bg-background text-text flex min-h-screen flex-col">
        <Nav />
        <main className="page-enter relative">
          <BackButton href="/" />
          <section className="bg-text text-on-dark px-4 py-16 sm:py-24">
            <div className="mx-auto max-w-6xl px-2 sm:px-4">
              <div className="grid gap-10 md:grid-cols-2 md:items-end">
                <div className="flex flex-col gap-5">
                  <p className="text-primary-light text-sm font-extrabold tracking-[2px]">
                    SIGNA PARA ORGANIZACIONES
                  </p>
                  <h1 className="font-display text-5xl leading-[0.98] font-extrabold tracking-tight text-balance sm:text-6xl">
                    Capacitá a tu equipo en LSA básica.
                  </h1>
                </div>
                <p className="text-on-dark/80 text-lg leading-relaxed">
                  Tu empresa u organización elige un curso temático y lo ofrece a un grupo de
                  personas. Cada una lo recibe gratis en su propia cuenta de Signa, y vos seguís el
                  avance del equipo desde un panel claro y accesible.
                </p>
              </div>

              <div className="relative mt-20">
                <div
                  aria-hidden
                  className="bg-ink-700 absolute inset-x-7 top-7 hidden h-[3px] lg:block"
                />
                <div
                  aria-hidden
                  className="landing-grow bg-primary absolute inset-x-7 top-7 hidden h-[3px] origin-left lg:block"
                />
                <ol className="relative grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
                  {STEPS.map((step, i) => (
                    <li
                      key={step.title}
                      className="landing-pop flex flex-col gap-3.5"
                      style={{ "--delay": `${300 + i * 150}ms` } as CSSProperties}
                    >
                      <div className="font-display bg-primary text-on-primary flex h-14 w-14 items-center justify-center rounded-full text-xl font-extrabold">
                        {i + 1}
                      </div>
                      <span className="font-display text-2xl font-bold tracking-tight">
                        {step.title}
                      </span>
                      <p className="text-on-dark/60 text-base leading-relaxed">{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-24 flex flex-col gap-10">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h2 className="font-display text-4xl font-extrabold tracking-tight">
                    Así se ve tu panel
                  </h2>
                  <span className="bg-on-dark/10 text-on-dark/70 rounded-full px-3.5 py-2 text-[13px] font-bold">
                    Datos de ejemplo
                  </span>
                </div>
                <PanelShot
                  shot={PANEL_SHOTS[0]!}
                  priority
                  sizes="(min-width: 1152px) 1120px, calc(100vw - 48px)"
                />
                <div className="grid gap-10 md:grid-cols-2">
                  {PANEL_SHOTS.slice(1).map((shot) => (
                    <PanelShot
                      key={shot.title}
                      shot={shot}
                      sizes="(min-width: 1152px) 544px, (min-width: 768px) 50vw, calc(100vw - 48px)"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-24 flex flex-col items-center gap-6 text-center">
                <h2 className="font-display text-4xl font-extrabold tracking-tight">
                  ¿Listo para empezar?
                </h2>
                <p className="text-on-dark/80 max-w-md text-lg leading-relaxed">
                  Ingresá a tu panel o registrá tu organización para capacitar a tu equipo en Lengua
                  de Señas Argentina.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/organizations/login"
                    className="landing-btn bg-primary text-on-primary flex min-h-14 items-center rounded-full px-7 text-base font-extrabold"
                  >
                    Ingresar a mi panel
                  </Link>
                  <Link
                    href="/organizations/login#registro"
                    className="landing-btn bg-background text-text flex min-h-14 items-center rounded-full px-7 text-base font-extrabold"
                  >
                    Registrá tu organización
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <LandingFooter />
      </div>
    </LandingUIProvider>
  );
}
