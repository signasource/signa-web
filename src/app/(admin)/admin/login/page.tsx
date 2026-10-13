"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/features/admin/admin-auth-context";
import { ApiError } from "@/lib/api/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const { status, login } = useAdminAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/admin");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) return;
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No pudimos iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-ink-900 flex min-h-screen items-center justify-center px-4">
      <div className="bg-ink-800 w-full max-w-sm rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <p className="font-display text-primary text-sm font-semibold tracking-wide uppercase">
            Signa
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold text-white">
            Panel de administración
          </h1>
          <p className="mt-1 text-sm text-white/50">Ingresá con tu cuenta de administrador.</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-white/70">
            Email
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              className="focus:border-primary focus:ring-primary rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:ring-1"
              placeholder="admin@signasource.com"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-white/70">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="focus:border-primary focus:ring-primary rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:ring-1"
              placeholder="••••••••"
            />
          </label>
          {error && (
            <p className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-primary mt-2 rounded-xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
