"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useWithCourse } from "@/features/dashboard/use-course-filter";
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, organization, logout } = useAuth();
  const withCourse = useWithCourse();

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
          <Link href={withCourse("/dashboard")} className="flex items-center gap-2.5">
            <Image
              src="/images/signa-logo.png"
              alt="SIGNA"
              width={34}
              height={34}
              priority
              className="size-[34px]"
            />
            <span aria-hidden="true" className="bg-border h-6 w-px" />
            <span className="font-display text-xl font-bold">{organization.name}</span>
          </Link>
          <nav aria-label="Secciones del panel" className="flex flex-wrap gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={withCourse(item.href)}
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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        {organization.status && organization.status !== "ACTIVE" ? (
          <div
            role="status"
            className="bg-shop-amber-light text-shop-amber-dark rounded-2xl px-5 py-4 text-sm font-semibold"
          >
            {organization.status === "PENDING"
              ? "Tu organización está pendiente de aprobación. Apenas SIGNA la active vas a poder invitar a tu equipo y ver su avance."
              : "Tu organización no está activa. Escribinos para reactivarla."}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
