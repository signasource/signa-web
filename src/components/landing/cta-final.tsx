import Image from "next/image";
import Link from "next/link";
import { OrgTrigger } from "@/components/landing/org-trigger";

export function CtaFinal() {
  return (
    <section className="bg-fill px-4 pb-4">
      <div className="relative overflow-hidden rounded-[48px] bg-primary pt-24 text-on-primary sm:pt-32">
        <div aria-hidden className="absolute -bottom-40 -left-28 h-[480px] w-[480px] rounded-full bg-primary-dark/40" />
        <div className="relative mx-auto flex min-h-[420px] max-w-6xl flex-col items-start gap-8 px-8">
          <h2 className="landing-big font-display max-w-3xl origin-left text-6xl font-extrabold leading-[0.94] tracking-tight sm:text-8xl">
            Tu primera seña te está esperando.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="#empezar"
              className="landing-btn flex min-h-14.5 items-center gap-2.5 rounded-full bg-text px-7.5 text-[17px] font-extrabold text-on-dark"
            >
              Empezá gratis
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <OrgTrigger className="landing-btn flex min-h-14.5 items-center rounded-full border-[1.5px] border-white/40 bg-white/15 px-7 text-[17px] font-extrabold text-white">
              Para organizaciones
            </OrgTrigger>
          </div>
        </div>
        <Image
          src="/images/lisa-waving.png"
          alt="Lisa saludando"
          width={280}
          height={560}
          className="landing-peek landing-final-lisa absolute -bottom-10 right-20 h-[560px] w-auto"
        />
      </div>
    </section>
  );
}
