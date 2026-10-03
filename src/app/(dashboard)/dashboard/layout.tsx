"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/members", label: "Participantes" },
  { href: "/dashboard/modules", label: "Contenidos" },
  { href: "/dashboard/invitations", label: "Invitaciones" },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

// Client-side guard: the API is stateless-bearer (no cookies), so there is no server session to check.
// Real authorization is enforced by signa-api on every request.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, organization, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated" || !organization) {
    return <p className="text-text-muted p-8">Cargando…</p>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-surface flex flex-wrap items-center justify-between gap-6 border-b px-6 py-4">
        <div className="flex flex-wrap items-center gap-7">
          <span className="font-display text-xl font-bold">{organization.name}</span>
          <nav aria-label="Secciones del panel" className="flex flex-wrap gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-bold transition-all duration-200",
                    active
                      ? "bg-primary-light text-primary-dark"
                      : "text-text-muted hover:bg-fill hover:text-text",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button onClick={logout} className="text-text-muted text-sm font-medium hover:underline">
          Cerrar sesión
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">{children}</main>
    </div>
  );
}
