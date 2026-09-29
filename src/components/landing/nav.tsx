import Link from "next/link";
import { OrgTrigger } from "@/components/landing/org-trigger";

export function Nav() {
  return (
    <header className="landing-nav sticky top-0 z-40">
      <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center gap-8 px-8 py-3.5">
        <Link href="#top" className="font-display text-text text-2xl font-extrabold tracking-tight">
          Signa
        </Link>
        <div className="ml-auto hidden items-center gap-7 md:flex">
          <Link
            href="#lisa"
            className="text-text/80 hover:text-primary-dark text-[15px] font-semibold"
          >
            Lisa
          </Link>
          <Link
            href="#que-es"
            className="text-text/80 hover:text-primary-dark text-[15px] font-semibold"
          >
            Qué es
          </Link>
          <Link
            href="#cursos"
            className="text-text/80 hover:text-primary-dark text-[15px] font-semibold"
          >
            Cursos
          </Link>
          <OrgTrigger className="text-text/80 hover:text-primary-dark text-[15px] font-semibold">
            Organizaciones
          </OrgTrigger>
          <Link
            href="#equipo"
            className="text-text/80 hover:text-primary-dark text-[15px] font-semibold"
          >
            Equipo
          </Link>
        </div>
        <Link
          href="#empezar"
          className="landing-btn bg-text text-on-dark ml-auto flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold md:ml-0"
        >
          Empezá gratis
        </Link>
      </nav>
    </header>
  );
}
