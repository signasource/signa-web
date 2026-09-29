"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/features/auth/auth-context";
import { ApiError } from "@/lib/api/client";

const schema = z.object({
  identifier: z.string().min(1, "Ingresá tu email o usuario."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { status, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values.identifier, values.password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos iniciar sesión con esa cuenta.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-3xl font-bold">Ingresar al panel</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email o usuario
          <input
            {...register("identifier")}
            autoComplete="username"
            className="border-border bg-surface rounded-lg border px-3 py-2"
          />
          {errors.identifier && <span className="text-danger">{errors.identifier.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Contraseña
          <input
            {...register("password")}
            type="password"
            autoComplete="current-password"
            className="border-border bg-surface rounded-lg border px-3 py-2"
          />
          {errors.password && <span className="text-danger">{errors.password.message}</span>}
        </label>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-text text-on-dark rounded-xl px-6 py-3 font-semibold disabled:opacity-60"
        >
          {isSubmitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
