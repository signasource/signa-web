import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
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
      <footer className="text-text-muted flex justify-center gap-6 px-6 py-6 text-sm">
        <Link href="/privacidad" className="hover:underline">
          Política de privacidad
        </Link>
        <Link href="/terminos" className="hover:underline">
          Términos y condiciones
        </Link>
      </footer>
    </div>
  );
}
