import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Providers } from "@/app/providers";
import { env } from "@/lib/env";
import "@/app/globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: "Signa — Aprendé Lengua de Señas Argentina", template: "%s · Signa" },
  description:
    "Signa es la app para aprender Lengua de Señas Argentina (LSA) con reconocimiento por cámara. Capacitá a tu equipo con cursos a medida.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
