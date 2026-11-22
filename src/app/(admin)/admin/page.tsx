"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth } from "@/features/admin/admin-auth-context";
import { adminApi } from "@/lib/api/admin";
import { NUMBER } from "@/components/dashboard/usage-business";
import { Card, CardTitle, LoadingState, PageHeading } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const CTA = "text-primary hover:text-primary-dark text-[13px] font-extrabold whitespace-nowrap";

type AttentionItem = {
  key: string;
  badge: string;
  title: string;
  sub: string;
  cta: string;
  tone: "danger" | "warning";
  href: string;
};

export default function AdminHomePage() {
  const { status } = useAdminAuth();
  const { data: stats, isPending } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.stats,
    enabled: status === "authenticated",
    staleTime: 60_000,
  });

  const items: AttentionItem[] = [];

  if (stats) {
    if (stats.pendingOrganizations > 0) {
      items.push({
        key: "orgs",
        badge: NUMBER.format(stats.pendingOrganizations),
        title: "Organizaciones pendientes de validar",
        sub: "Esperan aprobación",
        cta: "Validar",
        href: "/admin/organizations",
        tone: "warning",
      });
    }
    if (stats.pendingSignReports > 0) {
      items.push({
        key: "reports-pending",
        badge: NUMBER.format(stats.pendingSignReports),
        title: "Reportes de señas pendientes",
        sub: "Sin revisar aún",
        cta: "Revisar",
        href: "/admin/sign-reports",
        tone: "danger",
      });
    }
    if (stats.reviewedSignReports > 0) {
      items.push({
        key: "reports-reviewed",
        badge: NUMBER.format(stats.reviewedSignReports),
        title: "Reportes de señas en revisión",
        sub: "Revisados, pendientes de resolución",
        cta: "Resolver",
        href: "/admin/sign-reports",
        tone: "warning",
      });
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeading title="Inicio" />

      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <CardTitle>Requiere atención</CardTitle>
          {!isPending && (
            <span className="text-text-muted text-[13px]">
              {items.length} {items.length === 1 ? "tema" : "temas"}
            </span>
          )}
        </div>
        {isPending ? (
          <LoadingState>Cargando…</LoadingState>
        ) : items.length === 0 ? (
          <p className="text-text-muted text-sm">Todo en orden: nada pendiente de resolver.</p>
        ) : (
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.key} className="border-fill flex items-center gap-3 border-t py-3">
                <span
                  className={cn(
                    "font-display flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                    item.tone === "danger"
                      ? "bg-danger-light text-danger"
                      : "bg-shop-amber-light text-shop-amber-dark",
                  )}
                >
                  {item.badge}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{item.title}</p>
                  <p className="text-text-muted truncate text-[13px]">{item.sub}</p>
                </div>
                <Link href={item.href} className={CTA}>
                  {item.cta} ›
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
