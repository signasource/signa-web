import { FeatureCard } from "@/components/landing/feature-card";

export function QueEs() {
  return (
    <section id="que-es" className="scroll-mt-16 px-8 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="mb-7 text-sm font-extrabold tracking-[2px] text-primary">QUÉ ES SIGNA</p>
        <p className="landing-fillwrap max-w-3xl">
          <span className="landing-fill font-display text-4xl font-bold leading-snug tracking-tight text-balance sm:text-5xl">
            Signa enseña Lengua de Señas Argentina desde el celular: lecciones cortas, señas en 3D
            y una cámara que te corrige en el momento.
          </span>
        </p>
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FeatureCard
            id="signs"
            icon="/icons/apple.svg"
            title="Señas en 3D"
            description="Cada seña se ve animada, así entendés el movimiento completo y no solo una foto."
          />
          <FeatureCard
            id="camera"
            icon="/icons/camara.svg"
            title="Tu cámara te corrige"
            description="Signa reconoce tus señas en tiempo real y todo se procesa en tu teléfono: ningún video sale del dispositivo."
          />
          <FeatureCard
            id="streak"
            icon="/icons/alarm.svg"
            title="Un ratito por día"
            description="Elegí tu meta diaria de 5 a 20 minutos y sumás racha, gemas y XP mientras avanzás."
          />
        </div>
      </div>
    </section>
  );
}
