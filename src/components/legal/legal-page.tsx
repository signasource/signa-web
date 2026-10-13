import { BackButton } from "@/components/back-button";
import { legal } from "@/lib/legal";

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
    <div className="page-enter relative">
      <BackButton href="/" />
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 pt-20 pb-12 leading-relaxed">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-extrabold">{title}</h1>
          <p className="text-text-muted text-sm">Última actualización: {legal.lastUpdated}</p>
        </header>

        <div className="flex flex-col gap-8 [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
          {children}
        </div>
      </main>
    </div>
  );
}
