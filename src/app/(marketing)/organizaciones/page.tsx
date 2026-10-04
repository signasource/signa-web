import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LandingUIProvider } from "@/components/landing/landing-ui-provider";
import { Nav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import "@/app/(marketing)/landing.css";

export const metadata: Metadata = {
  title: "Signa para organizaciones",
  alternates: { canonical: "/organizaciones" },
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
    body: "Métricas simples: quién empezó, cuánto avanzó y cuántas señas aprendió.",
  },
] as const;

const DEMO_KPIS = [
  { label: "Personas inscriptas", value: "24" },
  { label: "Activas esta semana", value: "18" },
  { label: "Avance promedio", value: "62%" },
  { label: "Completaron el curso", value: "5" },
] as const;

const DEMO_MEMBERS = [
  {
    initials: "CR",
    name: "Carla R.",
    progress: 100,
    last: "Hoy",
    badge: "bg-avatar-teal-light text-avatar-teal-dark",
    bar: "bg-success",
  },
  {
    initials: "DM",
    name: "Diego M.",
    progress: 74,
    last: "Ayer",
    badge: "bg-primary-light text-primary-dark",
    bar: "bg-primary",
  },
  {
    initials: "LP",
    name: "Lucía P.",
    progress: 51,
    last: "Hace 3 días",
    badge: "bg-avatar-wine-light text-social-wine",
    bar: "bg-primary",
  },
  {
    initials: "MS",
    name: "Martín S.",
    progress: 18,
    last: "Hace 9 días",
    badge: "bg-shop-amber-light text-shop-amber-dark",
    bar: "bg-streak-orange",
  },
] as const;

export default function OrganizacionesPage() {
  return (
    <LandingUIProvider>
      <div className="bg-background text-text flex min-h-screen flex-col">
        <Nav />
        <main>
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

              <div className="bg-background text-text mt-24 rounded-[32px] p-8 shadow-2xl">
                <div className="flex flex-wrap items-center gap-3.5">
                  <span className="font-display text-lg font-bold tracking-tight">
                    Panel de organización
                  </span>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <span className="bg-shop-amber-light text-shop-amber-dark rounded-full px-3.5 py-2 text-[13px] font-extrabold">
                      Curso: Atención al cliente
                    </span>
                    <span className="bg-fill text-text-muted rounded-full px-3.5 py-2 text-[13px] font-bold">
                      Datos de ejemplo
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {DEMO_KPIS.map((kpi) => (
                    <div
                      key={kpi.label}
                      className="border-border bg-surface rounded-2xl border p-[18px]"
                    >
                      <p className="text-text-muted text-[13px] font-bold">{kpi.label}</p>
                      <p className="font-display mt-1.5 text-4xl font-extrabold tracking-tight">
                        {kpi.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-border bg-surface mt-4 rounded-2xl border px-5 py-2">
                  <div className="border-border text-text-muted grid grid-cols-[2fr_3fr_1fr] gap-4 border-b py-3 text-xs font-extrabold tracking-wider">
                    <span>PERSONA</span>
                    <span>AVANCE DEL CURSO</span>
                    <span>ÚLTIMA VEZ</span>
                  </div>
                  {DEMO_MEMBERS.map((p, i) => (
                    <div
                      key={p.name}
                      className={`grid grid-cols-[2fr_3fr_1fr] items-center gap-4 py-3 ${i < DEMO_MEMBERS.length - 1 ? "border-fill border-b" : ""}`}
                    >
                      <div className="flex items-center gap-2.5 text-[15px] font-bold">
                        <span
                          className={`font-display flex h-[34px] w-[34px] items-center justify-center rounded-full text-xs font-extrabold ${p.badge}`}
                        >
                          {p.initials}
                        </span>
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="bg-fill h-2.5 flex-grow overflow-hidden rounded-full">
                          <div
                            className={`landing-grow h-2.5 origin-left rounded-full ${p.bar}`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="w-11 text-sm font-extrabold">{p.progress}%</span>
                      </div>
                      <span className="text-text-muted text-sm">{p.last}</span>
                    </div>
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
                    href="/organizaciones/ingresar"
                    className="landing-btn bg-primary text-on-primary flex min-h-14 items-center rounded-full px-7 text-base font-extrabold"
                  >
                    Ingresar a mi panel
                  </Link>
                  <Link
                    href="/organizaciones/ingresar#registro"
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
