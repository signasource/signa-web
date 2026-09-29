const ROW_1 = ["Hola", "·", "Gracias", "·", "Buen día", "·", "¿Cómo estás?", "·", "Familia", "·", "Amistad", "·", "Hola", "·", "Gracias"];
const ROW_2 = ["Por favor", "·", "Perdón", "·", "Nos vemos", "·", "Te quiero", "·", "Bienvenida", "·", "Por favor", "·", "Perdón"];

export function Marquesina() {
  return (
    <section aria-hidden className="flex flex-col gap-1.5 overflow-hidden py-10">
      <div className="landing-mq font-display flex gap-12 whitespace-nowrap text-6xl font-extrabold tracking-tight text-text sm:text-8xl">
        {ROW_1.map((word, i) => (
          <span key={i}>{word}</span>
        ))}
      </div>
      <div
        className="landing-mq2 font-display flex gap-12 whitespace-nowrap text-6xl font-extrabold tracking-tight sm:text-8xl"
        style={{ color: "transparent", WebkitTextStroke: "2px var(--color-primary-medallion)" }}
      >
        {ROW_2.map((word, i) => (
          <span key={i}>{word}</span>
        ))}
      </div>
    </section>
  );
}
