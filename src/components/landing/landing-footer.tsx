import Link from "next/link";
import { OrgTrigger } from "@/components/landing/org-trigger";

export function LandingFooter() {
  return (
    <footer className="bg-fill text-text-muted mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-12 pt-12 pb-8">
      <span className="font-display text-text text-xl font-extrabold tracking-tight">Signa</span>
      <p className="text-sm font-semibold">
        Proyecto Final · Ingeniería en Sistemas de Información · UTN FRC
      </p>
      <div className="text-text ml-auto flex flex-wrap items-center gap-5 text-sm font-bold">
        <Link href="#que-es">Qué es</Link>
        <OrgTrigger>Organizaciones</OrgTrigger>
        <Link href="#equipo">Equipo</Link>
        <Link href="/privacidad" className="text-text-muted font-normal hover:underline">
          Privacidad
        </Link>
        <Link href="/terminos" className="text-text-muted font-normal hover:underline">
          Términos
        </Link>
        <span className="font-normal">© {new Date().getFullYear()} Signa</span>
      </div>
    </footer>
  );
}
