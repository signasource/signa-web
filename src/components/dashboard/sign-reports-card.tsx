"use client";

import Link from "next/link";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { Card, CardTitle } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import type { LearningMetrics } from "@/lib/api/metrics";
import { cn } from "@/lib/utils";

const BIG = "font-display text-[32px] leading-9 font-extrabold tracking-tight";

/**
 * Sign reports across the whole history (the API does not window them): what is pending, what was
 * resolved and how long resolving takes, plus the signs to look at first — the pending ones while
 * there are any, otherwise the most reported overall.
 */
export function SignReportsCard({
  pending,
  reports,
  className,
}: {
  pending: number | undefined;
  reports: LearningMetrics["reports"];
  className?: string;
}) {
  const showPending = (pending ?? 0) > 0 && reports.mostReportedPending.length > 0;
  const top = (showPending ? reports.mostReportedPending : reports.mostReported).slice(0, 3);
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4", className)}>
      <div className="flex items-center gap-1.5">
        <CardTitle>Reportes de señas</CardTitle>
        <Link
          href="/admin/sign-reports"
          className="text-primary hover:text-primary-dark ml-auto text-[13px] font-extrabold"
        >
          Ver reportes ›
        </Link>
        <InfoPopover metric="sign_report_resolution" />
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <div>
          <p className={cn(BIG, (pending ?? 0) > 0 ? "text-danger" : "")}>
            {pending == null ? "—" : NUMBER.format(pending)}
          </p>
          <p className="text-text-muted text-[13px]">Pendientes</p>
        </div>
        <div>
          <p className={BIG}>{NUMBER.format(reports.resolvedCount)}</p>
          <p className="text-text-muted text-[13px]">Resueltos</p>
        </div>
        <div>
          <p className={BIG}>
            {reports.resolvedCount
              ? `${Math.round(reports.averageResolutionHours).toLocaleString("es-AR")} h`
              : "—"}
          </p>
          <p className="text-text-muted text-[13px]">Resolución prom.</p>
        </div>
      </div>
      {top.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-text-muted text-[12px] font-bold">
            {showPending ? "Para revisar primero" : "Las más reportadas"}
          </p>
          <dl className="flex flex-col">
            {top.map((m) => (
              <div
                key={m.meaning}
                className="border-fill flex justify-between gap-3 border-b py-2.5 text-sm last:border-b-0"
              >
                <dt className="font-extrabold">{m.meaning}</dt>
                <dd className="text-text-muted shrink-0">
                  {NUMBER.format(m.count)} {m.count === 1 ? "reporte" : "reportes"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="text-text-muted text-sm">Nadie reportó señas todavía.</p>
      )}
    </Card>
  );
}
