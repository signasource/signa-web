"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

export default function OrgPanelPage() {
  const router = useRouter();
  const { status, organization, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/organizaciones/ingresar");
  }, [status, router]);

  if (status === "loading" || !organization) {
    return (
      <div className="bg-background text-text-muted flex min-h-screen items-center justify-center">
        <p className="text-[15px]">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-text flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border flex items-center justify-between border-b px-5 py-4 sm:px-8">
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
        <div className="flex items-center gap-5">
          <span className="font-display text-sm font-bold">{organization.name}</span>
          <button
            type="button"
            onClick={logout}
            className="text-text-muted text-sm font-medium hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-5 py-16 text-center">
        <div className="relative">
          <Image
            src="/images/lisa-arms-crossed.png"
            alt="Lisa, la guía de Signa"
            width={400}
            height={400}
            className="h-48 w-auto"
          />
        </div>

        <div className="flex flex-col gap-4">
          <span className="bg-accent-amber text-text mx-auto rounded-full px-4 py-2 text-[13px] font-extrabold tracking-wide">
            MUY PRONTO
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Estamos terminando el módulo organizacional.
          </h1>
          <p className="text-text-muted mx-auto max-w-sm text-lg leading-relaxed">
            El panel para {organization.name} va a estar disponible muy pronto. Te avisamos por
            email en cuanto esté listo.
          </p>
        </div>

        <Link
          href="/organizaciones"
          className="text-text-muted flex items-center gap-2 text-sm font-semibold hover:underline"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Volver a Signa para organizaciones
        </Link>
      </main>
    </div>
  );
}
