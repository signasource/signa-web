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
        <p className="text-primary mb-5 text-sm font-extrabold tracking-[2px]">CURSOS</p>
        <h2 className="landing-rv font-display mb-14 max-w-2xl text-5xl leading-none font-extrabold tracking-tight text-balance sm:text-6xl">
          Empezás gratis. Te especializás cuando quieras.
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="landing-rv-l bg-text text-on-dark relative flex flex-col gap-5.5 overflow-hidden rounded-[36px] p-11">
            <div
              aria-hidden
              className="bg-primary absolute -top-16 -right-16 h-[240px] w-[240px] rounded-full"
            />
            <div className="relative flex items-center gap-2.5">
              <span className="bg-success rounded-full px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide text-white">
                GRATIS PARA SIEMPRE
              </span>
              <Image
                src="/icons/corona.svg"
                alt=""
                aria-hidden
                width={30}
                height={30}
                className="h-[30px] w-[30px]"
              />
            </div>
            <p className="font-display relative text-5xl leading-none font-extrabold tracking-tight">
              Curso básico de LSA
            </p>
            <p className="text-on-dark/70 relative max-w-md text-lg leading-relaxed">
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
              href="#empezar"
              className="landing-btn bg-on-dark text-text relative mt-auto flex min-h-13.5 items-center self-start rounded-full px-6.5 text-base font-extrabold"
            >
              Empezá gratis
            </Link>
          </div>

          <div className="landing-rv-r border-border bg-surface flex flex-col gap-5.5 rounded-[36px] border p-11">
            <div className="flex items-center justify-between gap-3">
              <span className="bg-primary-light text-primary-dark rounded-full px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide">
                CURSOS TEMÁTICOS
              </span>
              <span className="text-text-muted text-[15px] font-bold">Desde [PRECIO]</span>
            </div>
            <p className="font-display text-5xl leading-none font-extrabold tracking-tight">
              LSA para tu área
            </p>
            <p className="text-text-muted text-lg leading-relaxed">
              Cursos prearmados con el vocabulario que necesitás en tu trabajo. Los comprás vos o te
              los regala tu organización.
            </p>
            <div className="flex flex-col gap-2.5">
              {THEMATIC.map((item) => (
                <div
                  key={item.title}
                  className="bg-background flex items-center gap-3.5 rounded-2xl p-3.5"
                >
                  <ThematicIcon icon={item.icon} />
                  <div>
                    <p className="font-display text-lg font-bold">{item.title}</p>
                    <p className="text-text-muted text-[14.5px]">{item.body}</p>
                  </div>
                </div>
              ))}
              <div className="border-border flex items-center gap-3.5 rounded-2xl border-[1.5px] border-dashed p-3.5">
                <div className="bg-fill text-text-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                  <svg
                    aria-hidden="true"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <circle cx="5" cy="12" r="1.2" />
                    <circle cx="12" cy="12" r="1.2" />
                    <circle cx="19" cy="12" r="1.2" />
                  </svg>
                </div>
                <div>
                  <p className="font-display text-lg font-bold">Y más en camino</p>
                  <p className="text-text-muted text-[14.5px]">[PRÓXIMOS CURSOS]</p>
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
    <div className="bg-avatar-blue-light flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
      <Image
        src={icon}
        alt=""
        aria-hidden
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
      />
    </div>
  );
}
