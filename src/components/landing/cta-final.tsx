import Image from "next/image";
import Link from "next/link";

export function CtaFinal() {
  return (
    <section className="bg-fill px-4 pb-4">
      <div className="bg-primary text-on-primary relative overflow-hidden rounded-[48px] pt-24 sm:pt-32">
        <div
          aria-hidden
          className="bg-primary-dark/40 absolute -bottom-40 -left-28 h-[480px] w-[480px] rounded-full"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 pb-16 sm:px-8 lg:min-h-[420px] lg:pb-0">
          <h2
            data-reveal="zoom"
            className="font-display max-w-3xl origin-left text-5xl leading-[0.94] font-extrabold tracking-tight sm:text-7xl lg:text-8xl"
          >
            Tu primera seña te está esperando.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/proximamente"
              className="landing-btn bg-text text-on-dark flex min-h-14.5 items-center gap-2.5 rounded-full px-7.5 text-[17px] font-extrabold"
            >
              Empezá gratis
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
        <Image
          src="/images/lisa-waving.png"
          alt="Lisa saludando"
          width={800}
          height={800}
          data-reveal="peek"
          className="landing-floaty3 absolute -right-10 -bottom-10 hidden h-[520px] w-[520px] lg:block xl:right-10"
        />
      </div>
    </section>
  );
}
