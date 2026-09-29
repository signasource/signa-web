"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";

// Client-side guard: the API is stateless-bearer (no cookies), so there is no server session to check.
// Real authorization is enforced by signa-api on every request.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, organization, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated" || !organization) {
    return <p className="text-text-muted p-8">Cargando…</p>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-border bg-surface flex items-center justify-between border-b px-6 py-4">
        <span className="font-display text-xl font-bold">{organization.name}</span>
        <button onClick={logout} className="text-text-muted text-sm font-medium hover:underline">
          Cerrar sesión
        </button>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
