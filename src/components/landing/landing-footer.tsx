import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-fill text-text-muted">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-4 px-5 pt-12 pb-8 sm:px-8">
        <span className="font-display text-text text-base font-extrabold tracking-tight">
          Signa
        </span>
        <p className="text-xs font-semibold">
          Proyecto Final · Ingeniería en Sistemas de Información · UTN FRC
        </p>
        <div className="text-text flex flex-wrap items-center gap-4 text-xs font-bold md:ml-auto">
          <Link href="/privacidad" className="text-text-muted font-normal hover:underline">
            Privacidad
          </Link>
          <Link href="/terminos" className="text-text-muted font-normal hover:underline">
            Términos
          </Link>
          <span className="font-normal">© {new Date().getFullYear()} Signa</span>
        </div>
        <p className="border-border w-full border-t pt-4 text-xs leading-relaxed">
          Todo lo que hacemos en Signa sigue los lineamientos de la Confederación Argentina de
          Sordos (CAS) y cuenta con el respaldo y la consulta de personas de la comunidad sorda.
        </p>
      </div>
    </footer>
  );
}
