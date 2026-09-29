import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-5xl font-extrabold">Signa</h1>
      <p className="text-text-muted text-lg">
        Aprendé Lengua de Señas Argentina con reconocimiento por cámara. Capacitá a tu equipo con
        cursos a medida.
      </p>
      <Link
        href="/login"
        className="bg-text text-on-dark rounded-xl px-6 py-3 font-semibold transition hover:opacity-90"
      >
        Ingresar al panel
      </Link>
    </main>
  );
}
