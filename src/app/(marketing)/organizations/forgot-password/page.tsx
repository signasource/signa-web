"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BackButton } from "@/components/back-button";
import { useAuth } from "@/features/auth/auth-context";
import { authApi } from "@/lib/api/auth";
import { mapAuthError } from "@/lib/auth-errors";

const CODE_LENGTH = 6;

const emailSchema = z.object({
  email: z.string().min(1, "Ingresá tu email.").email("Ingresá un email válido."),
});

const resetSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Ingresá el código de 6 dígitos que te enviamos."),
    newPassword: z
      .string()
      .min(1, "Ingresá tu nueva contraseña.")
      .min(8, "La contraseña debe tener entre 8 y 72 caracteres.")
      .max(72, "La contraseña debe tener entre 8 y 72 caracteres."),
    confirmPassword: z.string().min(1, "Confirmá tu nueva contraseña."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

type EmailValues = z.infer<typeof emailSchema>;
type ResetValues = z.infer<typeof resetSchema>;

const INPUT =
  "border-border bg-surface focus:ring-primary/30 h-12 w-full rounded-2xl border px-3.5 text-[15px] outline-none focus:ring-2";
const LABEL = "flex flex-col gap-1.5 text-[13px] font-bold";
const ERROR = "text-danger text-[12px] font-medium";
const BUTTON = "bg-text text-on-dark mt-2 min-h-14 rounded-2xl font-extrabold disabled:opacity-60";

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });

  async function onSubmit({ email }: EmailValues) {
    setServerError(null);
    try {
      await authApi.forgotPassword(email.trim());
      onSent(email.trim());
    } catch (err) {
      setServerError(mapAuthError(err, "No pudimos enviar el correo. Intentalo de nuevo."));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <label className={LABEL}>
        Email
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          placeholder="contacto@empresa.com"
          className={INPUT}
        />
        {errors.email && <span className={ERROR}>{errors.email.message}</span>}
      </label>

      {serverError && <p className={ERROR}>{serverError}</p>}

      <button type="submit" disabled={isSubmitting} className={BUTTON}>
        {isSubmitting ? "Enviando…" : "Enviar código"}
      </button>
    </form>
  );
}

function ResetStep({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(values: ResetValues) {
    setServerError(null);
    setResent(false);
    try {
      await authApi.resetPassword(email, values.code, values.newPassword);
    } catch (err) {
      setServerError(mapAuthError(err, "No pudimos restablecer la contraseña."));
      return;
    }
    try {
      await login(email, values.newPassword);
      router.push("/dashboard");
    } catch {
      // The password already changed: if the automatic sign-in fails, let them sign in by hand.
      router.push("/organizations/login");
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    setServerError(null);
    try {
      await authApi.forgotPassword(email);
      setValue("code", "");
      setResent(true);
    } catch (err) {
      setServerError(mapAuthError(err, "No pudimos reenviar el código."));
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <p className="text-text-muted text-[15px] text-pretty">
        Si hay una cuenta con <strong className="text-text">{email}</strong>, te enviamos un código
        de 6 dígitos. Vence en 15 minutos.
      </p>

      <label className={LABEL}>
        Código de 6 dígitos
        <input
          {...register("code", {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              e.target.value = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
            },
          })}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          placeholder="123456"
          className={INPUT}
        />
        {errors.code && <span className={ERROR}>{errors.code.message}</span>}
      </label>

      <label className={LABEL}>
        Nueva contraseña
        <input
          {...register("newPassword")}
          type="password"
          autoComplete="new-password"
          className={INPUT}
        />
        {errors.newPassword && <span className={ERROR}>{errors.newPassword.message}</span>}
      </label>

      <label className={LABEL}>
        Confirmá la contraseña
        <input
          {...register("confirmPassword")}
          type="password"
          autoComplete="new-password"
          className={INPUT}
        />
        {errors.confirmPassword && <span className={ERROR}>{errors.confirmPassword.message}</span>}
      </label>

      {serverError && <p className={ERROR}>{serverError}</p>}
      {resent && <p className="text-text-muted text-[13px]">Te enviamos un código nuevo.</p>}

      <button type="submit" disabled={isSubmitting} className={BUTTON}>
        {isSubmitting ? "Guardando…" : "Guardar contraseña"}
      </button>

      <p className="text-text-muted text-center text-[14px]">
        ¿No te llegó?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-primary font-bold disabled:opacity-60"
        >
          {resending ? "Reenviando…" : "Reenviar código"}
        </button>
        {" · "}
        <button type="button" onClick={onChangeEmail} className="text-primary font-bold">
          Probar con otro correo
        </button>
      </p>
    </form>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string | null>(null);

  return (
    <div className="bg-background text-text flex min-h-screen flex-col">
      <header className="border-border border-b px-5 py-4 sm:px-8">
        <Link
          href="/organizations"
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
        <BackButton href="/organizations/login" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 py-12 sm:px-0">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {email === null ? "¿Olvidaste tu contraseña?" : "Nueva contraseña"}
            </h1>
            <p className="text-text-muted text-[15px]">
              {email === null
                ? "Ingresá tu email y te mandamos un código para crear una nueva."
                : "Ingresá el código que te enviamos y elegí una nueva contraseña."}
            </p>
          </div>

          {email === null ? (
            <EmailStep onSent={setEmail} />
          ) : (
            <ResetStep email={email} onChangeEmail={() => setEmail(null)} />
          )}

          <p className="text-text-muted text-center text-[14px]">
            ¿Te acordaste?{" "}
            <Link href="/organizations/login" className="text-primary font-bold">
              Volver a ingresar
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
