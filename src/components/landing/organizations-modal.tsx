"use client";

import Image from "next/image";
import { useLandingUI } from "@/components/landing/landing-ui-context";
import { CloseButton } from "@/components/landing/close-button";

const STEPS = [
  {
    title: "Elegí el curso",
    body: "Salud, atención al cliente, educación u otro curso temático.",
    icon: null,
  },
  {
    title: "Definí el grupo",
    body: "Abonás un monto por el conjunto de personas que va a hacer el curso. [PRECIO / MODALIDAD]",
    icon: "/icons/gift.svg",
  },
  {
    title: "Cada quien, en su cuenta",
    body: "Tus empleados acceden al curso gratis desde su cuenta individual, junto con el curso básico.",
    icon: null,
  },
  {
    title: "Seguí el avance",
    body: "Métricas simples: quién empezó, cuánto avanzó y cuántas señas aprendió.",
    icon: null,
  },
] as const;

const PARTICIPANTS = [
  { initials: "CR", name: "Carla R.", progress: 100, last: "Hoy", bar: "bg-success", badge: "bg-avatar-teal-light text-avatar-teal-dark" },
  { initials: "DM", name: "Diego M.", progress: 74, last: "Ayer", bar: "bg-primary", badge: "bg-primary-light text-primary-dark" },
  { initials: "LP", name: "Lucía P.", progress: 51, last: "Hace 3 días", bar: "bg-primary", badge: "bg-avatar-wine-light text-social-wine" },
  { initials: "MS", name: "Martín S.", progress: 18, last: "Hace 9 días", bar: "bg-streak-orange", badge: "bg-shop-amber-light text-shop-amber-dark" },
] as const;

const KPIS = [
  { label: "Personas inscriptas", value: "24" },
  { label: "Activas esta semana", value: "18" },
  { label: "Avance promedio", value: "62%" },
  { label: "Completaron el curso", value: "5" },
] as const;

export function OrganizationsModal() {
  const { closeOrg } = useLandingUI();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Signa para organizaciones"
      className="landing-modal-in fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-8 py-4">
          <span className="font-display text-xl font-extrabold tracking-tight">Signa para organizaciones</span>
          <CloseButton onClick={closeOrg} className="ml-auto" />
        </div>
      </div>

      <div className="landing-modal-card mx-auto max-w-6xl px-8 pb-24 pt-12">
        <section className="rounded-[40px] bg-text px-6 py-16 text-on-dark sm:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-2 md:items-end">
            <div className="flex flex-col gap-5">
              <p className="text-sm font-extrabold tracking-[2px] text-primary-light">
                SIGNA PARA ORGANIZACIONES
              </p>
              <h2 className="font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-balance sm:text-6xl">
                Capacitá a tu equipo en LSA básica.
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-on-dark/80">
              Tu empresa u organización elige un curso temático y lo ofrece a un grupo de personas.
              Cada una lo recibe gratis en su propia cuenta de Signa, y vos seguís el avance del
              equipo desde un panel claro y accesible.
            </p>
          </div>

          <div className="relative mt-20">
            <div aria-hidden className="absolute inset-x-7 top-7 h-[3px] bg-ink-700" />
            <div aria-hidden className="landing-grow absolute inset-x-7 top-7 h-[3px] origin-left bg-primary" />
            <ol className="relative grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="landing-pop flex flex-col gap-3.5">
                  <div className="font-display flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-on-primary">
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-2xl font-bold tracking-tight">{step.title}</span>
                    {step.icon && (
                      <Image src={step.icon} alt="" aria-hidden width={32} height={32} className="h-8 w-8" />
                    )}
                  </div>
                  <p className="text-base leading-relaxed text-on-dark/60">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="landing-rv mt-24 rounded-[32px] bg-background p-8 text-text shadow-2xl">
            <div className="flex flex-wrap items-center gap-3.5">
              <span className="font-display text-lg font-bold tracking-tight">Panel de organización</span>
              <span className="font-display text-2xl font-bold tracking-tight">[Tu organización]</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <span className="rounded-full bg-shop-amber-light px-3.5 py-2 text-[13px] font-extrabold text-shop-amber-dark">
                  Curso: Atención al cliente
                </span>
                <span className="rounded-full bg-fill px-3.5 py-2 text-[13px] font-bold text-text-muted">
                  Datos de ejemplo
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {KPIS.map((kpi) => (
                <div key={kpi.label} className="rounded-2xl border border-border bg-surface p-[18px]">
                  <p className="text-[13px] font-bold text-text-muted">{kpi.label}</p>
                  <p className="font-display mt-1.5 text-4xl font-extrabold tracking-tight">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-surface px-5 py-2">
              <div className="grid grid-cols-[2fr_3fr_1fr] gap-4 border-b border-border py-3 text-xs font-extrabold tracking-wider text-text-muted">
                <span>PERSONA</span>
                <span>AVANCE DEL CURSO</span>
                <span>ÚLTIMA VEZ</span>
              </div>
              {PARTICIPANTS.map((p, i) => (
                <div
                  key={p.name}
                  className={`grid grid-cols-[2fr_3fr_1fr] items-center gap-4 py-3 ${i < PARTICIPANTS.length - 1 ? "border-b border-fill" : ""}`}
                >
                  <div className="flex items-center gap-2.5 text-[15px] font-bold">
                    <span className={`font-display flex h-[34px] w-[34px] items-center justify-center rounded-full text-xs font-extrabold ${p.badge}`}>
                      {p.initials}
                    </span>
                    {p.name}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-2.5 flex-grow overflow-hidden rounded-full bg-fill">
                      <div className={`landing-grow h-2.5 origin-left rounded-full ${p.bar}`} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="w-11 text-sm font-extrabold">{p.progress}%</span>
                  </div>
                  <span className="text-sm text-text-muted">{p.last}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-24 grid gap-12 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-4xl font-extrabold tracking-tight">Hablemos.</h3>
              <p className="max-w-md text-lg leading-relaxed text-on-dark/80">
                Contanos sobre tu organización y qué necesita tu equipo. Te respondemos para armar
                la propuesta.
              </p>
              <p className="flex items-center gap-2.5 text-base font-bold">[EMAIL DE CONTACTO]</p>
            </div>

            <ContactForm />
          </div>
        </section>
      </div>
    </div>
  );
}

function ContactForm() {
  return (
    <form className="landing-rv flex flex-col gap-3.5 rounded-3xl bg-background p-7 text-text">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Nombre y apellido
          <input type="text" name="nombre" className="h-12 rounded-2xl border border-border bg-fill px-3.5 text-[15px]" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Organización
          <input type="text" name="organizacion" className="h-12 rounded-2xl border border-border bg-fill px-3.5 text-[15px]" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Email
          <input type="email" name="email" className="h-12 rounded-2xl border border-border bg-fill px-3.5 text-[15px]" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Cantidad de personas
          <input type="number" name="personas" min={1} className="h-12 rounded-2xl border border-border bg-fill px-3.5 text-[15px]" />
        </label>
      </div>
      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-[13px] font-bold">Curso de interés</legend>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "salud", label: "Salud" },
            { value: "atencion", label: "Atención al cliente" },
            { value: "educacion", label: "Educación" },
            { value: "otro", label: "Otro" },
          ].map((opt, i) => (
            <label
              key={opt.value}
              className="landing-chip flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-fill px-4 text-sm font-bold"
            >
              <input type="radio" name="curso" value={opt.value} defaultChecked={i === 0} className="accent-primary" />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5 text-[13px] font-bold">
        Mensaje
        <textarea name="mensaje" rows={3} className="resize-y rounded-2xl border border-border bg-fill px-3.5 py-3 text-[15px]" />
      </label>
      <button
        type="button"
        className="landing-btn min-h-14 rounded-2xl bg-primary text-base font-extrabold text-on-primary"
      >
        Quiero Signa para mi equipo
      </button>
    </form>
  );
}
