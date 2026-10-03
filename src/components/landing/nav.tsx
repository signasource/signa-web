import Image from "next/image";
import Link from "next/link";
import { OrgTrigger } from "@/components/landing/org-trigger";
import { MobileMenu } from "@/components/landing/mobile-menu";
import { NAV_LINKS } from "@/components/landing/nav-links";

export function Nav() {
  return (
    <header data-landing-nav className="landing-nav sticky top-0 z-40">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-[72px] max-w-6xl items-center gap-4 px-5 sm:gap-8 sm:px-8"
      >
        <Link href="/" className="font-display text-text flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Image src="/images/signa-logo.png" alt="" aria-hidden width={36} height={36} className="h-9 w-9" />
          Signa
        </Link>
        <div className="ml-auto hidden items-center gap-7 md:flex">
          {NAV_LINKS.slice(0, 3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="landing-nav-link text-text/80 hover:text-primary-dark text-[15px] font-semibold transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <OrgTrigger className="landing-nav-link text-text/80 hover:text-primary-dark text-[15px] font-semibold transition-colors">
            Organizaciones
          </OrgTrigger>
          <Link
            href="/#equipo"
            className="landing-nav-link text-text/80 hover:text-primary-dark text-[15px] font-semibold transition-colors"
          >
            Equipo
          </Link>
        </div>
        <Link
          href="/proximamente"
          className="landing-btn bg-text text-on-dark ml-auto flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold md:ml-0"
        >
          Empezá gratis
        </Link>
        <MobileMenu />
      </nav>
    </header>
  );
}
