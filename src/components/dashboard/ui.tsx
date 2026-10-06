import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/components/dashboard/icons";
import {
  initials,
  progressTone,
  type DisplayStatus,
  type ProgressTone,
} from "@/lib/dashboard-format";
import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl leading-9 font-bold">{title}</h1>
        {subtitle ? <p className="text-text-muted mt-1 max-w-2xl text-[15px]">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function Card({
  className,
  children,
  delay,
}: {
  className?: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <div
      className={cn("border-border bg-surface dash-card-enter rounded-2xl border p-5", className)}
      style={delay !== undefined ? ({ "--delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-lg font-bold tracking-tight">{children}</h2>;
}

export function StatCard({
  label,
  value,
  hint,
  children,
  delay,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="border-border bg-surface dash-card-enter rounded-2xl border p-[18px]"
      style={delay !== undefined ? ({ "--delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      <p className="text-text-muted text-[13px] font-bold">{label}</p>
      <p className="font-display dash-stat-pop mt-1.5 text-4xl leading-10 font-extrabold tracking-tight">
        {value}
      </p>
      {hint ? <p className="text-text-muted mt-1.5 text-[13px]">{hint}</p> : null}
      {children}
    </div>
  );
}

const TONE_BAR: Record<ProgressTone, string> = {
  success: "bg-success",
  warning: "bg-streak-orange",
  primary: "bg-primary",
};

export function ProgressBar({
  percent,
  tone,
  className,
  label,
}: {
  percent: number;
  tone?: ProgressTone;
  className?: string;
  label?: string;
}) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
      className={cn("bg-fill h-2.5 overflow-hidden rounded-full", className)}
    >
      <div
        className={cn(
          "dash-progress-fill h-full rounded-full",
          TONE_BAR[tone ?? progressTone(value)],
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

const AVATARS = [
  "bg-primary-light text-primary-dark",
  "bg-avatar-teal-light text-avatar-teal-dark",
  "bg-avatar-wine-light text-social-wine",
  "bg-shop-amber-light text-shop-amber-dark",
  "bg-avatar-blue-light text-gems-blue-dark",
  "bg-avatar-green-light text-success-dark",
];

function avatarIndex(seed: string): number {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % AVATARS.length;
}

export function Avatar({
  seed,
  name,
  lastName,
  size = "md",
}: {
  seed: string;
  name: string;
  lastName: string;
  size?: "md" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display dash-avatar-hover flex shrink-0 items-center justify-center rounded-full font-extrabold",
        size === "lg" ? "size-[72px] text-[26px]" : "size-[34px] text-xs",
        AVATARS[avatarIndex(seed)],
      )}
    >
      {initials(name, lastName)}
    </span>
  );
}

const STATUS: Record<DisplayStatus, { label: string; className: string }> = {
  completed: { label: "Completó", className: "bg-primary-light text-primary-dark" },
  active: { label: "Activo", className: "bg-success-light text-success-dark" },
  inactive: { label: "Inactivo", className: "bg-shop-amber-light text-shop-amber-dark" },
  notStarted: { label: "Sin iniciar", className: "bg-fill text-text" },
  removed: { label: "Quitado", className: "bg-danger-light text-danger" },
};

export function StatusPill({ status }: { status: DisplayStatus }) {
  const { label, className } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function SectionIcon({ name, className }: { name: IconName; className: string }) {
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", className)}
    >
      <Icon name={name} />
    </span>
  );
}

export function StatRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-col">
      {rows.map((row) => (
        <div
          key={row.label}
          className="border-fill flex justify-between gap-3 border-b py-2.5 text-sm last:border-b-0"
        >
          <dt className="text-text-muted">{row.label}</dt>
          <dd className="flex items-center gap-1 font-extrabold">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const primaryButton =
  "bg-text text-on-dark inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-60";
export const pillButton =
  "border-border bg-surface inline-flex cursor-pointer items-center gap-1 rounded-full border px-3.5 py-2 text-[13px] font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50";

export function LoadingState({ children = "Cargando…" }: { children?: ReactNode }) {
  return (
    <div className="text-text-muted flex items-center gap-1.5">
      <span className="dash-loading-dot" style={{ "--delay": "0s" } as CSSProperties} />
      <span className="dash-loading-dot" style={{ "--delay": "0.18s" } as CSSProperties} />
      <span className="dash-loading-dot" style={{ "--delay": "0.36s" } as CSSProperties} />
      <span className="sr-only">{children}</span>
    </div>
  );
}

export function ErrorState({ children }: { children: ReactNode }) {
  return <p className="text-danger">{children}</p>;
}

export function EmptyState({
  title,
  body,
  action,
  mascot = false,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  mascot?: boolean;
}) {
  return (
    <div className="border-border bg-surface flex flex-col items-center gap-3.5 rounded-3xl border px-6 py-12 text-center">
      {mascot ? (
        <Image src="/images/lisa-waving.png" alt="" width={120} height={120} className="h-auto" />
      ) : null}
      <p className="font-display text-2xl font-bold tracking-tight">{title}</p>
      <p className="text-text-muted max-w-md text-[15px] text-pretty">{body}</p>
      {action}
    </div>
  );
}
