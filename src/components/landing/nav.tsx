import Link from "next/link";
import { OrgTrigger } from "@/components/landing/org-trigger";

export function Nav() {
  return (
    <header className="landing-nav sticky top-0 z-40">
      <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center gap-8 px-8 py-3.5">
        <Link href="#top" className="font-display text-2xl font-extrabold tracking-tight text-text">
          Signa
        </Link>
        <div className="ml-auto hidden items-center gap-7 md:flex">
          <Link href="#lisa" className="text-[15px] font-semibold text-text/80 hover:text-primary-dark">
            Lisa
          </Link>
          <Link href="#que-es" className="text-[15px] font-semibold text-text/80 hover:text-primary-dark">
            Qué es
          </Link>
          <Link href="#cursos" className="text-[15px] font-semibold text-text/80 hover:text-primary-dark">
            Cursos
          </Link>
          <OrgTrigger className="text-[15px] font-semibold text-text/80 hover:text-primary-dark">
            Organizaciones
          </OrgTrigger>
          <Link href="#equipo" className="text-[15px] font-semibold text-text/80 hover:text-primary-dark">
            Equipo
          </Link>
        </div>
        <Link
          href="#empezar"
          className="landing-btn ml-auto flex min-h-11 items-center gap-2 rounded-full bg-text px-5 text-sm font-bold text-on-dark md:ml-0"
        >
          Empezá gratis
        </Link>
      </nav>
    </header>
  );
}
