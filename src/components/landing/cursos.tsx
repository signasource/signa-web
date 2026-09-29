import Link from "next/link";
import Image from "next/image";

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
    icon: "/icons/graduation-cap.svg",
    title: "Educación",
    body: "Para docentes y personal de escuelas.",
  },
] as const;

export function Cursos() {
  return (
    <section id="cursos" className="scroll-mt-10 px-8 py-24 sm:py-32">
      <div id="empezar" aria-hidden className="relative -top-10" />
      <div className="mx-auto max-w-6xl">
        <p className="mb-5 text-sm font-extrabold tracking-[2px] text-primary">CURSOS</p>
        <h2 className="landing-rv font-display mb-14 max-w-2xl text-5xl font-extrabold leading-none tracking-tight text-balance sm:text-6xl">
          Empezás gratis. Te especializás cuando quieras.
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="landing-rv-l relative flex flex-col gap-5.5 overflow-hidden rounded-[36px] bg-text p-11 text-on-dark">
            <div aria-hidden className="absolute -right-16 -top-16 h-[240px] w-[240px] rounded-full bg-primary" />
            <div className="relative flex items-center gap-2.5">
              <span className="rounded-full bg-success px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide text-white">
                GRATIS PARA SIEMPRE
              </span>
              <Image src="/icons/corona.svg" alt="" aria-hidden width={30} height={30} className="h-[30px] w-[30px]" />
            </div>
            <p className="font-display relative text-5xl font-extrabold leading-none tracking-tight">
              Curso básico de LSA
            </p>
            <p className="relative max-w-md text-lg leading-relaxed text-on-dark/70">
              Para todas las personas que usan Signa. Las bases para comunicarte desde el primer
              día, alfabeto manual incluido.
            </p>
            <ul className="relative flex flex-col gap-3">
              {[
                "Lecciones con señas animadas en 3D",
                "Ejercicios con reconocimiento por cámara",
                "Práctica libre y repaso de errores",
                "Racha, gemas, tienda y amigos",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-base font-semibold">
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-success">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="#empezar"
              className="landing-btn relative mt-auto flex min-h-13.5 items-center self-start rounded-full bg-on-dark px-6.5 text-base font-extrabold text-text"
            >
              Empezá gratis
            </Link>
          </div>

          <div className="landing-rv-r flex flex-col gap-5.5 rounded-[36px] border border-border bg-surface p-11">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-primary-light px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide text-primary-dark">
                CURSOS TEMÁTICOS
              </span>
              <span className="text-[15px] font-bold text-text-muted">Desde [PRECIO]</span>
            </div>
            <p className="font-display text-5xl font-extrabold leading-none tracking-tight">LSA para tu área</p>
            <p className="text-lg leading-relaxed text-text-muted">
              Cursos prearmados con el vocabulario que necesitás en tu trabajo. Los comprás vos o
              te los regala tu organización.
            </p>
            <div className="flex flex-col gap-2.5">
              {THEMATIC.map((item) => (
                <div key={item.title} className="flex items-center gap-3.5 rounded-2xl bg-background p-3.5">
                  <ThematicIcon icon={item.icon} />
                  <div>
                    <p className="font-display text-lg font-bold">{item.title}</p>
                    <p className="text-[14.5px] text-text-muted">{item.body}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3.5 rounded-2xl border-[1.5px] border-dashed border-border p-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fill text-text-muted">
                  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="5" cy="12" r="1.2" />
                    <circle cx="12" cy="12" r="1.2" />
                    <circle cx="19" cy="12" r="1.2" />
                  </svg>
                </div>
                <div>
                  <p className="font-display text-lg font-bold">Y más en camino</p>
                  <p className="text-[14.5px] text-text-muted">[PRÓXIMOS CURSOS]</p>
                </div>
              </div>
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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger-light text-danger">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
    );
  }
  if (icon === "message") {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-shop-amber-light text-shop-amber-dark">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-avatar-blue-light">
      <Image src={icon} alt="" aria-hidden width={40} height={40} className="h-10 w-10 object-contain" />
    </div>
  );
}
