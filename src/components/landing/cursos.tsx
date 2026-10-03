import Image from "next/image";
import Link from "next/link";
import { OrgTrigger } from "@/components/landing/org-trigger";

const THEMATIC = [
  {
    icon: "danger",
    title: "Salud",
    body: "Para equipos que atienden pacientes.",
  },
  {
    icon: "message",
    title: "Atención al cliente",
    body: "Para mostradores, bancos, comercios y oficinas.",
  },
  {
    icon: "book",
    title: "Educación",
    body: "Para docentes y personal de escuelas.",
  },
] as const;

export function Cursos() {
  return (
    <section id="cursos" className="scroll-mt-10 px-5 py-24 sm:px-8 sm:py-32">
      <div id="empezar" aria-hidden className="relative -top-10" />
      <div className="mx-auto max-w-6xl">
        <p className="text-primary mb-5 text-sm font-extrabold tracking-[2px]">CURSOS</p>
        <h2 className="landing-rv font-display mb-14 text-5xl leading-none font-extrabold tracking-tight sm:text-6xl">
          Empezás gratis. Te especializás cuando quieras.
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Basic course — white/light */}
          <div className="landing-rv-l border-border bg-surface relative flex flex-col gap-5.5 overflow-hidden rounded-[36px] border p-11">
            <div
              aria-hidden
              className="bg-primary/10 absolute -top-16 -right-16 h-[240px] w-[240px] rounded-full"
            />
            <div className="relative flex items-center gap-2.5">
              <span className="bg-success rounded-full px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide text-white">
                GRATIS
              </span>
            </div>
            <p className="font-display relative text-5xl leading-none font-extrabold tracking-tight">
              Curso básico de LSA
            </p>
            <p className="text-text-muted relative max-w-md text-lg leading-relaxed">
              Para todas las personas que usan Signa. Las bases para comunicarte desde el primer
              día.
            </p>
            <ul className="relative flex flex-col gap-3">
              {[
                "Lecciones con señas animadas en 3D",
                "Ejercicios con reconocimiento por cámara",
                "Práctica libre y repaso de errores",
                "Racha, gemas, tienda y amigos",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-base font-semibold">
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-success"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/proximamente"
              className="landing-btn bg-text text-on-dark relative mt-auto flex min-h-13.5 items-center self-start rounded-full px-6.5 text-base font-extrabold"
            >
              Probá una lección
            </Link>
          </div>

          {/* Thematic courses — dark */}
          <div className="landing-rv-r bg-text text-on-dark relative flex flex-col gap-5.5 overflow-hidden rounded-[36px] p-11">
            <div
              aria-hidden
              className="bg-primary absolute -top-16 -right-16 h-[240px] w-[240px] rounded-full"
            />
            <Image
              src="/icons/corona.svg"
              alt=""
              aria-hidden
              width={96}
              height={96}
              className="absolute right-8 bottom-8 h-28 w-28 opacity-30"
            />
            <div className="relative flex items-center justify-between gap-3">
              <span className="bg-primary text-on-primary rounded-full px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide">
                CURSOS TEMÁTICOS
              </span>
              <span className="text-on-dark/60 text-[15px] font-bold">Desde $10</span>
            </div>
            <p className="font-display relative text-5xl leading-none font-extrabold tracking-tight">
              LSA para tu área
            </p>
            <p className="text-on-dark/70 relative text-lg leading-relaxed">
              Cursos prearmados con el vocabulario que necesitás en tu trabajo. Los comprás vos o te
              los regala tu organización.
            </p>
            <div className="relative flex flex-col gap-2.5">
              {THEMATIC.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-3.5 rounded-2xl bg-white/10 p-3.5"
                >
                  <ThematicIcon icon={item.icon} />
                  <div>
                    <p className="font-display text-lg font-bold">{item.title}</p>
                    <p className="text-on-dark/60 text-[14.5px]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative mt-auto rounded-2xl border border-white/20 p-4">
              <p className="font-display text-base font-bold">¿Sos una organización?</p>
              <p className="text-on-dark/60 mt-1 text-[14px] leading-snug">
                Podés darle los cursos a tu equipo para capacitarlos en Lengua de Señas Argentina.
              </p>
              <OrgTrigger className="landing-btn mt-3 flex min-h-10 items-center gap-1.5 self-start rounded-full border border-white/30 bg-white/15 px-4 text-sm font-bold text-white">
                Ver más sobre organizaciones
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </OrgTrigger>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ThematicIcon({ icon }: { icon: string }) {
  if (icon === "danger") {
    return (
      <div className="bg-danger-light text-danger flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
    );
  }
  if (icon === "message") {
    return (
      <div className="bg-shop-amber-light text-shop-amber-dark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="bg-avatar-blue-light text-gems-blue-dark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
      <svg
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </div>
  );
}
