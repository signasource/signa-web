"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
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
  {
    initials: "CR",
    name: "Carla R.",
    progress: 100,
    last: "Hoy",
    bar: "bg-success",
    badge: "bg-avatar-teal-light text-avatar-teal-dark",
  },
  {
    initials: "DM",
    name: "Diego M.",
    progress: 74,
    last: "Ayer",
    bar: "bg-primary",
    badge: "bg-primary-light text-primary-dark",
  },
  {
    initials: "LP",
    name: "Lucía P.",
    progress: 51,
    last: "Hace 3 días",
    bar: "bg-primary",
    badge: "bg-avatar-wine-light text-social-wine",
  },
  {
    initials: "MS",
    name: "Martín S.",
    progress: 18,
    last: "Hace 9 días",
    bar: "bg-streak-orange",
    badge: "bg-shop-amber-light text-shop-amber-dark",
  },
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
      className="landing-modal-in bg-background fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="border-border bg-background/95 sticky top-0 z-10 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4 sm:px-8">
          <span className="font-display text-xl font-extrabold tracking-tight">
            Signa para organizaciones
          </span>
          <CloseButton onClick={closeOrg} className="ml-auto" />
        </div>
      </div>

      <div className="landing-modal-card mx-auto max-w-6xl px-3 pt-6 pb-24 sm:px-8 sm:pt-12">
        <section className="bg-text text-on-dark rounded-[40px] px-6 py-16 sm:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-2 md:items-end">
            <div className="flex flex-col gap-5">
              <p className="text-primary-light text-sm font-extrabold tracking-[2px]">
                SIGNA PARA ORGANIZACIONES
              </p>
              <h2 className="font-display text-5xl leading-[0.98] font-extrabold tracking-tight text-balance sm:text-6xl">
                Capacitá a tu equipo en LSA básica.
              </h2>
            </div>
            <p className="text-on-dark/80 text-lg leading-relaxed">
              Tu empresa u organización elige un curso temático y lo ofrece a un grupo de personas.
              Cada una lo recibe gratis en su propia cuenta de Signa, y vos seguís el avance del
              equipo desde un panel claro y accesible.
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
                  <div className="flex items-center gap-2">
                    <span className="font-display text-2xl font-bold tracking-tight">
                      {step.title}
                    </span>
                    {step.icon && (
                      <Image
                        src={step.icon}
                        alt=""
                        aria-hidden
                        width={32}
                        height={32}
                        className="h-8 w-8"
                      />
                    )}
                  </div>
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
              <span className="font-display text-2xl font-bold tracking-tight">
                [Tu organización]
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
              {KPIS.map((kpi) => (
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
              {PARTICIPANTS.map((p, i) => (
                <div
                  key={p.name}
                  className={`grid grid-cols-[2fr_3fr_1fr] items-center gap-4 py-3 ${i < PARTICIPANTS.length - 1 ? "border-fill border-b" : ""}`}
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

          <div className="mt-24 grid gap-12 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-4xl font-extrabold tracking-tight">Hablemos.</h3>
              <p className="text-on-dark/80 max-w-md text-lg leading-relaxed">
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
    <form className="bg-background text-text flex flex-col gap-3.5 rounded-3xl p-5 sm:p-7">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Nombre y apellido
          <input
            type="text"
            name="nombre"
            className="border-border bg-fill h-12 rounded-2xl border px-3.5 text-[15px]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Organización
          <input
            type="text"
            name="organizacion"
            className="border-border bg-fill h-12 rounded-2xl border px-3.5 text-[15px]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Email
          <input
            type="email"
            name="email"
            className="border-border bg-fill h-12 rounded-2xl border px-3.5 text-[15px]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Cantidad de personas
          <input
            type="number"
            name="personas"
            min={1}
            className="border-border bg-fill h-12 rounded-2xl border px-3.5 text-[15px]"
          />
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
              className="landing-chip bg-fill flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold"
            >
              <input
                type="radio"
                name="curso"
                value={opt.value}
                defaultChecked={i === 0}
                className="accent-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5 text-[13px] font-bold">
        Mensaje
        <textarea
          name="mensaje"
          rows={3}
          className="border-border bg-fill resize-y rounded-2xl border px-3.5 py-3 text-[15px]"
        />
      </label>
      <button
        type="button"
        className="landing-btn bg-primary text-on-primary min-h-14 rounded-2xl text-base font-extrabold"
      >
        Quiero Signa para mi equipo
      </button>
    </form>
  );
}
