"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BackButton } from "@/components/back-button";
import { useAuth } from "@/features/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { formatCuit, validateCuit } from "@/lib/cuit";

type Tab = "login" | "registro";

const loginSchema = z.object({
  identifier: z.string().min(1, "Ingresá tu email."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

const registroSchema = z
  .object({
    organizacion: z.string().min(2, "Ingresá el nombre de tu organización."),
    cuit: z
      .string()
      .min(1, "Ingresá el CUIT de tu organización.")
      .refine((v) => validateCuit(v), "El CUIT no es válido."),
    email: z.string().email("Ingresá un email válido."),
    telefono: z.string().optional(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegistroValues = z.infer<typeof registroSchema>;

const INPUT =
  "border-border bg-surface focus:ring-primary/30 h-12 w-full rounded-2xl border px-3.5 text-[15px] outline-none focus:ring-2";
const LABEL = "flex flex-col gap-1.5 text-[13px] font-bold";
const ERROR = "text-danger text-[12px] font-medium";

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      await login(values.identifier, values.password);
      onSuccess();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "No pudimos iniciar sesión con esa cuenta.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <label className={LABEL}>
        Email
        <input
          {...register("identifier")}
          type="email"
          autoComplete="email"
          placeholder="contacto@empresa.com"
          className={INPUT}
        />
        {errors.identifier && <span className={ERROR}>{errors.identifier.message}</span>}
      </label>

      <label className={LABEL}>
        Contraseña
        <input
          {...register("password")}
          type="password"
          autoComplete="current-password"
          className={INPUT}
        />
        {errors.password && <span className={ERROR}>{errors.password.message}</span>}
      </label>

      {serverError && <p className={ERROR}>{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-text text-on-dark mt-2 min-h-14 rounded-2xl font-extrabold disabled:opacity-60"
      >
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

function RegistroForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistroValues>({ resolver: zodResolver(registroSchema) });

  function handleCuitChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCuit(e.target.value);
    setValue("cuit", formatted, { shouldValidate: false });
    e.target.value = formatted;
  }

  async function onSubmit(_values: RegistroValues) {
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
    onSuccess();
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full text-3xl">
          ✓
        </div>
        <h3 className="font-display text-2xl font-bold">¡Recibimos tu solicitud!</h3>
        <p className="text-text-muted max-w-xs text-[15px] leading-relaxed">
          Estamos finalizando el módulo organizacional. Te avisamos en cuanto el registro esté
          disponible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <label className={LABEL}>
        Nombre de la organización
        <input
          {...register("organizacion")}
          type="text"
          autoComplete="organization"
          placeholder="Empresa S.A."
          className={INPUT}
        />
        {errors.organizacion && <span className={ERROR}>{errors.organizacion.message}</span>}
      </label>

      <label className={LABEL}>
        CUIT
        <input
          {...register("cuit")}
          type="text"
          inputMode="numeric"
          placeholder="30-12345678-9"
          onChange={handleCuitChange}
          className={INPUT}
        />
        {errors.cuit && <span className={ERROR}>{errors.cuit.message}</span>}
      </label>

      <label className={LABEL}>
        Email de contacto
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          placeholder="contacto@empresa.com"
          className={INPUT}
        />
        {errors.email && <span className={ERROR}>{errors.email.message}</span>}
      </label>

      <label className={LABEL}>
        Teléfono <span className="text-text-muted font-normal">(opcional)</span>
        <input
          {...register("telefono")}
          type="tel"
          autoComplete="tel"
          placeholder="+54 11 1234-5678"
          className={INPUT}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={LABEL}>
          Contraseña
          <input
            {...register("password")}
            type="password"
            autoComplete="new-password"
            className={INPUT}
          />
          {errors.password && <span className={ERROR}>{errors.password.message}</span>}
        </label>
        <label className={LABEL}>
          Confirmá la contraseña
          <input
            {...register("confirmPassword")}
            type="password"
            autoComplete="new-password"
            className={INPUT}
          />
          {errors.confirmPassword && (
            <span className={ERROR}>{errors.confirmPassword.message}</span>
          )}
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-text text-on-dark mt-2 min-h-14 rounded-2xl font-extrabold disabled:opacity-60"
      >
        {isSubmitting ? "Enviando solicitud…" : "Registrar organización"}
      </button>
    </form>
  );
}

export default function IngresarPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const registroRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#registro") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab("registro");
      registroRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.replace("/organizaciones/panel");
  }, [status, router]);

  return (
    <div className="bg-background text-text flex min-h-screen flex-col">
      <header className="border-border border-b px-5 py-4 sm:px-8">
        <Link
          href="/organizaciones"
          className="font-display text-text flex items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          <Image
            src="/images/signa-logo.png"
            alt=""
            aria-hidden
            width={32}
            height={32}
            className="h-8 w-8"
          />
          Signa
        </Link>
      </header>

      <div className="page-enter relative flex flex-1 flex-col">
        <BackButton href="/organizaciones" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 py-12 sm:px-0">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {tab === "login" ? "Ingresar al panel" : "Registrar organización"}
            </h1>
            <p className="text-text-muted text-[15px]">Signa para organizaciones</p>
          </div>

          <div className="bg-fill flex rounded-2xl p-1">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                tab === "login" ? "bg-background shadow" : "text-text-muted"
              }`}
            >
              Ingresar
            </button>
            <button
              ref={registroRef}
              type="button"
              onClick={() => setTab("registro")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                tab === "registro" ? "bg-background shadow" : "text-text-muted"
              }`}
            >
              Registrarse
            </button>
          </div>

          {tab === "login" ? (
            <LoginForm onSuccess={() => router.push("/organizaciones/panel")} />
          ) : (
            <RegistroForm onSuccess={() => {}} />
          )}
        </main>
      </div>
    </div>
  );
}
