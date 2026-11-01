"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { invitationsApi } from "@/lib/api/invitations";
import { sessionApi } from "@/lib/api/session";
import type { AcceptedInvitation, InvitationPreview } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import {
  invitationLoginSchema,
  invitationRegisterSchema,
  usernameFromEmail,
  type InvitationLoginValues,
  type InvitationRegisterValues,
} from "@/lib/invitation-account";

const INPUT =
  "border-border bg-surface focus:ring-primary/30 h-12 w-full rounded-2xl border px-3.5 text-[15px] outline-none focus:ring-2";
const LABEL = "flex flex-col gap-1.5 text-[13px] font-bold";
const ERROR = "text-danger text-[12px] font-medium";
const SUBMIT = "bg-text text-on-dark mt-2 min-h-14 rounded-2xl font-extrabold disabled:opacity-60";

function acceptErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "La contraseña no es correcta.";
    if (err.status === 403) return "Esta invitación es para otro email.";
    if (err.status === 409)
      return "Tu cuenta ya pertenece a otra organización. Escribile a quien te invitó.";
    if (err.status === 400) return "La invitación ya no es válida.";
    if (err.status === 404) return "No encontramos la invitación.";
  }
  return "No pudimos aceptar la invitación. Probá de nuevo.";
}

function registerErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 409) {
    return "Ya existe una cuenta con este email. Iniciá sesión.";
  }
  return acceptErrorMessage(err);
}

async function acceptAndLeave(token: string): Promise<AcceptedInvitation> {
  try {
    return await invitationsApi.accept(token);
  } finally {
    sessionApi.logout();
  }
}

function LoginForm({
  invitation,
  onAccepted,
}: {
  invitation: InvitationPreview & { token: string };
  onAccepted: (result: AcceptedInvitation) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvitationLoginValues>({ resolver: zodResolver(invitationLoginSchema) });

  async function onSubmit(values: InvitationLoginValues) {
    setServerError(null);
    try {
      await sessionApi.login(invitation.email, values.password);
      onAccepted(await acceptAndLeave(invitation.token));
    } catch (err) {
      setServerError(acceptErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <label className={LABEL}>
        Email
        <input value={invitation.email} readOnly autoComplete="username" className={INPUT} />
      </label>
      <label className={LABEL}>
        Contraseña de tu cuenta de Signa
        <input
          {...register("password")}
          type="password"
          autoComplete="current-password"
          className={INPUT}
        />
        {errors.password && <span className={ERROR}>{errors.password.message}</span>}
      </label>
      {serverError && <p className={ERROR}>{serverError}</p>}
      <button type="submit" disabled={isSubmitting} className={SUBMIT}>
        {isSubmitting ? "Aceptando…" : "Iniciar sesión y aceptar"}
      </button>
    </form>
  );
}

function RegisterForm({
  invitation,
  onAccepted,
}: {
  invitation: InvitationPreview & { token: string };
  onAccepted: (result: AcceptedInvitation) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvitationRegisterValues>({ resolver: zodResolver(invitationRegisterSchema) });

  async function onSubmit(values: InvitationRegisterValues) {
    setServerError(null);
    const account = {
      email: invitation.email,
      password: values.password,
      name: values.name.trim(),
      lastName: values.lastName.trim(),
    };
    try {
      try {
        await sessionApi.register({ ...account, username: usernameFromEmail(account.email) });
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 409)) throw err;
        await sessionApi.register({ ...account, username: usernameFromEmail(account.email) });
      }
    } catch (err) {
      setServerError(registerErrorMessage(err));
      return;
    }
    try {
      onAccepted(await acceptAndLeave(invitation.token));
    } catch (err) {
      setServerError(acceptErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <label className={LABEL}>
        Email
        <input value={invitation.email} readOnly autoComplete="email" className={INPUT} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={LABEL}>
          Nombre
          <input {...register("name")} autoComplete="given-name" className={INPUT} />
          {errors.name && <span className={ERROR}>{errors.name.message}</span>}
        </label>
        <label className={LABEL}>
          Apellido
          <input {...register("lastName")} autoComplete="family-name" className={INPUT} />
          {errors.lastName && <span className={ERROR}>{errors.lastName.message}</span>}
        </label>
      </div>
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
      {serverError && <p className={ERROR}>{serverError}</p>}
      <button type="submit" disabled={isSubmitting} className={SUBMIT}>
        {isSubmitting ? "Creando tu cuenta…" : "Crear cuenta y aceptar"}
      </button>
    </form>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="text-text-muted text-[15px] text-pretty">{body}</p>
    </div>
  );
}

function InvitationContent() {
  const token = useSearchParams().get("token") ?? "";
  const [accepted, setAccepted] = useState<AcceptedInvitation | null>(null);
  const [mode, setMode] = useState<"login" | "register" | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => invitationsApi.preview(token),
    enabled: token !== "",
    retry: false,
  });

  if (!token) {
    return (
      <Message
        title="Falta el link de invitación"
        body="Abrí el link que te llegó por email para aceptar la invitación."
      />
    );
  }
  if (isPending) return <p className="text-text-muted">Cargando…</p>;
  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <Message
        title="Este link ya no es válido"
        body="Puede que la organización haya cambiado el email de la invitación. Revisá si te llegó un correo más nuevo o escribile a quien te invitó."
      />
    ) : (
      <p className="text-danger">No pudimos cargar los datos.</p>
    );
  }

  if (accepted) {
    return (
      <Message
        title="¡Listo, ya tenés acceso!"
        body={`Podés usar el curso ${accepted.courseName} de ${accepted.organizationName} hasta el ${formatDate(accepted.accessExpiresAt)}. Abrí la app de Signa e iniciá sesión con ${data.email}.`}
      />
    );
  }

  if (data.status === "ACTIVE" || data.status === "ACCESS_EXPIRED") {
    return (
      <Message
        title="Ya aceptaste esta invitación"
        body={`Entrá a la app de Signa con ${data.email} para seguir con ${data.courseName}.`}
      />
    );
  }
  if (data.status === "INVITATION_EXPIRED") {
    return (
      <Message
        title="La invitación venció"
        body={`El plazo para aceptarla terminó${data.invitationDeadline ? ` el ${formatDate(data.invitationDeadline)}` : ""}. Si necesitás acceso, escribile a ${data.organizationName}.`}
      />
    );
  }
  if (data.status !== "INVITED") {
    return (
      <Message
        title="Esta invitación ya no es válida"
        body={`Escribile a ${data.organizationName} si creés que es un error.`}
      />
    );
  }

  const current = mode ?? (data.accountExists ? "login" : "register");
  const invitation = { ...data, token };

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {data.organizationName} te invitó a Signa
        </h1>
        <p className="text-text-muted text-[15px] text-pretty">
          Vas a tener {data.durationDays} días de acceso al curso{" "}
          <span className="text-text font-bold">{data.courseName}</span> desde que aceptes.
          {data.invitationDeadline
            ? ` Aceptala antes del ${formatDate(data.invitationDeadline)}.`
            : null}
        </p>
        <p className="text-text-muted text-[13px] text-pretty">
          La invitación es personal: solo funciona con la cuenta de {data.email}.
        </p>
      </div>

      {current === "login" ? (
        <LoginForm invitation={invitation} onAccepted={setAccepted} />
      ) : (
        <RegisterForm invitation={invitation} onAccepted={setAccepted} />
      )}

      <button
        type="button"
        onClick={() => setMode(current === "login" ? "register" : "login")}
        className="text-text-muted text-sm font-semibold hover:underline"
      >
        {current === "login"
          ? "¿Todavía no tenés cuenta? Creala"
          : "¿Ya tenés cuenta en Signa? Iniciá sesión"}
      </button>
    </>
  );
}

export default function InvitationPage() {
  return (
    <div className="bg-background text-text flex min-h-screen flex-col">
      <header className="border-border border-b px-5 py-4 sm:px-8">
        <span className="font-display text-text flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <Image
            src="/images/signa-logo.png"
            alt=""
            aria-hidden
            width={32}
            height={32}
            className="h-8 w-8"
          />
          Signa
        </span>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12 sm:px-0">
        <Suspense fallback={<p className="text-text-muted">Cargando…</p>}>
          <InvitationContent />
        </Suspense>
      </main>
    </div>
  );
}
