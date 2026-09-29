const ROW_1 = ["Hola", "Gracias", "Buen día", "¿Cómo estás?", "Familia", "Amistad"];
const ROW_2 = ["Por favor", "Perdón", "Nos vemos", "Te quiero", "Bienvenida", "Hermano"];

export function Marquesina() {
  return (
    <section aria-hidden className="landing-marquee flex flex-col gap-1.5 overflow-hidden py-10">
      <MarqueeRow words={ROW_1} className="text-text" />
      <MarqueeRow words={ROW_2} reverse className="landing-marquee-outline" />
    </section>
  );
}

function MarqueeRow({
  words,
  reverse,
  className,
}: {
  words: readonly string[];
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      data-reverse={reverse || undefined}
      className={`landing-marquee-track font-display flex w-max text-6xl font-extrabold tracking-tight whitespace-nowrap sm:text-8xl ${className ?? ""}`}
    >
      {[0, 1].map((copy) => (
        <div key={copy} className="flex shrink-0">
          {words.map((word) => (
            <span key={word} className="hover:text-primary flex items-center transition-colors">
              {word}
              <span className="text-primary-medallion px-6 sm:px-10">·</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
