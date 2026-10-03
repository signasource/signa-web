import { FeatureCard } from "@/components/landing/feature-card";

export function QueEs() {
  return (
    <section id="que-es" className="px-5 pt-10 pb-20 sm:px-8 sm:pt-14 sm:pb-28">
      <div className="mx-auto max-w-6xl">
        <h2
          data-reveal="up"
          className="font-display mb-14 max-w-2xl text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl"
        >
          Todo lo que podés hacer en <strong className="text-primary">Signa</strong>.
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          <FeatureCard id="signs" icon="/icons/apple.svg" title="Señas en 3D" />
          <FeatureCard
            id="camera"
            delayMs={100}
            icon="/icons/camara.svg"
            title="Tu cámara te corrige"
          />
          <FeatureCard
            id="streak"
            delayMs={200}
            icon="/icons/alarm.svg"
            title="Un ratito por día"
          />
          <FeatureCard
            id="social"
            delayMs={300}
            icon="/icons/heart.svg"
            title="Aprendé con amigos"
          />
        </div>
      </div>
    </section>
  );
}
