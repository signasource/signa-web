"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useWithFilters } from "@/features/dashboard/use-course-filter";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/members", label: "Participantes" },
  { href: "/dashboard/modules", label: "Contenidos" },
  { href: "/dashboard/purchases", label: "Compras" },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, organization, logout, refreshOrganization } = useAuth();
  const withFilters = useWithFilters();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const pending = status === "authenticated" && organization?.status !== "ACTIVE";
  useEffect(() => {
    if (!pending) return;
    const refresh = () => void refreshOrganization().catch(() => {});
    const timer = setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [pending, refreshOrganization]);

  if (status !== "authenticated" || !organization) {
    return <p className="text-text-muted p-8">Cargando…</p>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-surface flex flex-wrap items-center justify-between gap-6 border-b px-6 py-4">
        <div className="flex flex-wrap items-center gap-7">
          <Link href={withFilters("/dashboard")} className="flex items-center gap-2.5">
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
                  href={withFilters(item.href)}
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
              ? "Tu organización está pendiente de validación. Apenas SIGNA confirme que la representás vas a poder comprar cupos e invitar a tu equipo."
              : "Tu organización no está activa. Escribinos para reactivarla."}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
