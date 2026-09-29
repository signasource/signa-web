import Link from "next/link";
import { legal } from "@/lib/legal";

/** Visible marker for a decision the team still has to make. Search the repo for COMPLETAR/REVISAR. */
export function Todo({ children }: { children: React.ReactNode }) {
  return <mark className="bg-warning/30 rounded px-1">[{children}]</mark>;
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12 leading-relaxed">
      <Link href="/" className="text-text-muted text-sm font-medium hover:underline">
        ← Volver al inicio
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-extrabold">{title}</h1>
        <p className="text-text-muted text-sm">Última actualización: {legal.lastUpdated}</p>
        <p role="note" className="border-warning bg-warning/15 rounded-xl border px-4 py-3 text-sm">
          <strong>Borrador.</strong> Este documento fue redactado por el equipo del proyecto y aún
          no fue revisado por un profesional del derecho. Las partes resaltadas están pendientes de
          definición.
        </p>
      </header>

      <div className="flex flex-col gap-8 [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
    </main>
  );
}
