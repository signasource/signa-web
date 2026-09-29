import Link from "next/link";
import { OrgTrigger } from "@/components/landing/org-trigger";

export function LandingFooter() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 bg-fill px-12 pb-8 pt-12 text-text-muted">
      <span className="font-display text-xl font-extrabold tracking-tight text-text">Signa</span>
      <p className="text-sm font-semibold">Proyecto Final · Ingeniería en Sistemas de Información · UTN FRC</p>
      <div className="ml-auto flex flex-wrap items-center gap-5 text-sm font-bold text-text">
        <Link href="#que-es">Qué es</Link>
        <OrgTrigger>Organizaciones</OrgTrigger>
        <Link href="#equipo">Equipo</Link>
        <Link href="/privacidad" className="font-normal text-text-muted hover:underline">
          Privacidad
        </Link>
        <Link href="/terminos" className="font-normal text-text-muted hover:underline">
          Términos
        </Link>
        <span className="font-normal">© {new Date().getFullYear()} Signa</span>
      </div>
    </footer>
  );
}
