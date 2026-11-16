"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { useAdminAuth } from "@/features/admin/admin-auth-context";
import {
  adminApi,
  type AdminUser,
  type AdminUserDetail,
  type UserRole,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuario",
  ADMIN: "Admin Signa",
  ORG_ADMIN: "Admin de org.",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  USER: "bg-fill text-text-muted",
  ADMIN: "bg-primary/10 text-primary",
  ORG_ADMIN: "bg-accent-teal/10 text-accent-teal",
};

export function relativeDate(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-AR");
}

type Action = "disable" | "enable" | "delete";

const CONFIRM_TEXT: Record<Action, string> = {
  disable: "¿Deshabilitar esta cuenta? Se cierran sus sesiones y no podrá iniciar sesión.",
  enable: "¿Rehabilitar esta cuenta?",
  delete:
    "¿Eliminar esta cuenta? Se borran sus datos y su progreso, y su email queda libre. No se puede deshacer.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function courseVersionStatusLabel(status: string) {
  if (status === "PUBLISHED") return "Publicada";
  if (status === "ARCHIVED") return "Archivada";
  return status;
}

function courseVersionStatusColor(status: string) {
  if (status === "PUBLISHED") return "bg-[rgba(76,166,92,.12)] text-[#2E7D45]";
  if (status === "ARCHIVED") return "bg-[#EBE3DB] text-[#8C817A]";
  return "bg-[#F2ECE6] text-[#8C817A]";
}

function purchaseStatusLabel(status: string) {
  if (status === "PAID") return "Pagada";
  if (status === "PENDING_PAYMENT") return "Pendiente de pago";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "REFUNDED") return "Reembolsada";
  return status;
}

function purchaseStatusColor(status: string) {
  if (status === "PAID") return "bg-[rgba(76,166,92,.12)] text-[#2E7D45]";
  if (status === "PENDING_PAYMENT") return "bg-[rgba(251,191,36,.18)] text-[#B85806]";
  if (status === "CANCELLED" || status === "REFUNDED") return "bg-[#FBE0D8] text-[#E14E22]";
  return "bg-[#F2ECE6] text-[#8C817A]";
}

// ── Role-specific detail panels ───────────────────────────────────────────────

function AdminDetailPanel({ detail }: { detail: AdminUserDetail }) {
  return (
    <dl className="mb-5 grid grid-cols-2 gap-3 text-sm">
      <div>
        <dt className="text-text-muted text-xs">Rol</dt>
        <dd className="mt-1">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              ROLE_COLORS[detail.role],
            )}
          >
            {ROLE_LABELS[detail.role]}
          </span>
        </dd>
      </div>
      <div>
        <dt className="text-text-muted text-xs">Acceso</dt>
        <dd className="text-text mt-1 text-xs font-medium">
          {detail.authProvider === "GOOGLE" ? "Google" : "Email"}
          {" · "}
          <span className={detail.verified ? "text-success-dark" : "text-warning"}>
            {detail.verified ? "verificado" : "sin verificar"}
          </span>
        </dd>
      </div>
      <div>
        <dt className="text-text-muted text-xs">Estado</dt>
        <dd
          className={cn(
            "mt-1 text-xs font-medium",
            detail.enabled ? "text-success-dark" : "text-danger",
          )}
        >
          {detail.enabled ? "Habilitada" : "Deshabilitada"}
        </dd>
      </div>
      <div>
        <dt className="text-text-muted text-xs">Email</dt>
        <dd className="text-text mt-1 text-xs font-medium">{detail.email}</dd>
      </div>
    </dl>
  );
}

function OrgAdminDetailPanel({ detail }: { detail: AdminUserDetail }) {
  const org = detail.orgAdminDetail;
  return (
    <div className="mb-5 flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-text-muted text-xs">Rol</dt>
          <dd className="mt-1">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                ROLE_COLORS[detail.role],
              )}
            >
              {ROLE_LABELS[detail.role]}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-text-muted text-xs">Acceso</dt>
          <dd className="text-text mt-1 text-xs font-medium">
            {detail.authProvider === "GOOGLE" ? "Google" : "Email"}
            {" · "}
            <span className={detail.verified ? "text-success-dark" : "text-warning"}>
              {detail.verified ? "verificado" : "sin verificar"}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-text-muted text-xs">Estado cuenta</dt>
          <dd
            className={cn(
              "mt-1 text-xs font-medium",
              detail.enabled ? "text-success-dark" : "text-danger",
            )}
          >
            {detail.enabled ? "Habilitada" : "Deshabilitada"}
          </dd>
        </div>
        {org && (
          <>
            <div>
              <dt className="text-text-muted text-xs">Estado org.</dt>
              <dd className="text-text mt-1 text-xs font-medium">
                {org.orgStatus === "ACTIVE"
                  ? "Activa"
                  : org.orgStatus === "PENDING"
                    ? "Pendiente"
                    : org.orgStatus === "SUSPENDED"
                      ? "Suspendida"
                      : org.orgStatus}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-text-muted text-xs">Organización</dt>
              <dd className="text-text mt-1 text-xs font-medium">{detail.organizationName}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Empleados activos</dt>
              <dd className="text-text mt-1 text-xs font-semibold">{org.memberCount}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Compras</dt>
              <dd className="text-text mt-1 text-xs font-semibold">{org.purchases.length}</dd>
            </div>
          </>
        )}
      </dl>

      {org && org.purchases.length > 0 && (
        <div>
          <p className="text-text-muted mb-2 text-xs font-semibold uppercase tracking-wider">
            Cursos contratados
          </p>
          <div className="flex flex-col gap-2">
            {org.purchases.map((p, i) => (
              <div
                key={i}
                className="bg-fill flex items-start justify-between gap-3 rounded-xl px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-text truncate text-xs font-semibold">{p.courseName}</p>
                  <p className="text-text-muted mt-0.5 text-xs">
                    {p.totalSeats} cupos · {p.paidAt ? formatDate(p.paidAt) : "Sin pagar"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    purchaseStatusColor(p.purchaseStatus),
                  )}
                >
                  {purchaseStatusLabel(p.purchaseStatus)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {org && org.purchases.length === 0 && (
        <p className="text-text-muted text-xs">Sin cursos contratados.</p>
      )}
    </div>
  );
}

function UserDetailPanel({ detail }: { detail: AdminUserDetail }) {
  return (
    <div className="mb-5 flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-text-muted text-xs">Rol</dt>
          <dd className="mt-1">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                ROLE_COLORS[detail.role],
              )}
            >
              {ROLE_LABELS[detail.role]}
              {detail.isEmployeeOfOrg && (
                <span className="bg-accent-teal/10 text-accent-teal ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  Empleado
                </span>
              )}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-text-muted text-xs">Acceso</dt>
          <dd className="text-text mt-1 text-xs font-medium">
            {detail.authProvider === "GOOGLE" ? "Google" : "Email"}
            {" · "}
            <span className={detail.verified ? "text-success-dark" : "text-warning"}>
              {detail.verified ? "verificado" : "sin verificar"}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-text-muted text-xs">Estado</dt>
          <dd
            className={cn(
              "mt-1 text-xs font-medium",
              detail.enabled ? "text-success-dark" : "text-danger",
            )}
          >
            {detail.enabled ? "Habilitada" : "Deshabilitada"}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted text-xs">Racha</dt>
          <dd className="text-text mt-1 text-xs font-medium">
            {detail.currentStreak > 0 ? `${detail.currentStreak} días 🔥` : "Sin racha"}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted text-xs">Última actividad</dt>
          <dd className="text-text mt-1 text-xs font-medium">
            {relativeDate(detail.lastStreakDate)}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted text-xs">Precisión global</dt>
          <dd className="text-text mt-1 text-xs font-semibold">
            {detail.overallAccuracyPercent !== null && detail.overallAccuracyPercent !== undefined
              ? `${detail.overallAccuracyPercent}%`
              : "Sin datos"}
          </dd>
        </div>
        {detail.organizationName && (
          <div className="col-span-2">
            <dt className="text-text-muted text-xs">Organización</dt>
            <dd className="text-text mt-1 text-xs font-medium">{detail.organizationName}</dd>
          </div>
        )}
      </dl>

      {detail.enrollments && detail.enrollments.length > 0 && (
        <div>
          <p className="text-text-muted mb-2 text-xs font-semibold uppercase tracking-wider">
            Cursos en progreso
          </p>
          <div className="flex flex-col gap-2">
            {detail.enrollments.map((e) => (
              <div
                key={e.courseVersionId}
                className="bg-fill flex items-start justify-between gap-3 rounded-xl px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-text truncate text-xs font-semibold">{e.courseName}</p>
                  <p className="text-text-muted mt-0.5 text-xs">
                    v{e.version} · {e.enrollmentStatus === "COMPLETED" ? "Completado" : "En curso"}
                    {!e.grantsAccess && (
                      <span className="text-warning ml-1">(acceso vencido)</span>
                    )}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    courseVersionStatusColor(e.courseVersionStatus),
                  )}
                >
                  {courseVersionStatusLabel(e.courseVersionStatus)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.enrollments && detail.enrollments.length === 0 && (
        <p className="text-text-muted text-xs">Sin cursos activos.</p>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const qc = useQueryClient();
  const { admin } = useAdminAuth();
  const [confirm, setConfirm] = useState<Action | null>(null);
  const isSelf = admin?.id === user.id;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin", "users", user.id, "detail"],
    queryFn: () => adminApi.userDetail(user.id),
  });

  const mutate = useMutation({
    mutationFn: async (action: Action) => {
      if (action === "delete") await adminApi.deleteUser(user.id);
      else await adminApi.updateUser(user.id, { enabled: action === "enable" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "admins"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AdminAvatar
              name={user.name}
              lastName={user.lastName}
              avatar={user.avatar}
              className="size-10 text-sm"
            />
            <div>
              <h2 className="font-display text-text text-lg font-bold">
                {user.name} {user.lastName}
              </h2>
              <p className="text-text-muted text-xs">
                @{user.username} · {user.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1">
            ✕
          </button>
        </div>

        {detailLoading && (
          <div className="mb-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-fill h-8 animate-pulse rounded-xl" />
            ))}
          </div>
        )}

        {detail && detail.role === "ADMIN" && <AdminDetailPanel detail={detail} />}
        {detail && detail.role === "ORG_ADMIN" && <OrgAdminDetailPanel detail={detail} />}
        {detail && detail.role === "USER" && <UserDetailPanel detail={detail} />}

        {mutate.error && (
          <p className="text-danger mb-3 text-sm">
            {mutate.error instanceof Error ? mutate.error.message : "Error al actualizar."}
          </p>
        )}

        {isSelf ? (
          <p className="text-text-muted text-sm">
            Esta es tu cuenta: no podés deshabilitarla ni eliminarla desde acá.
          </p>
        ) : !confirm ? (
          <div className="flex flex-wrap gap-2">
            {user.enabled ? (
              <button
                onClick={() => setConfirm("disable")}
                className="border-danger text-danger hover:bg-danger/5 rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Deshabilitar cuenta
              </button>
            ) : (
              <button
                onClick={() => setConfirm("enable")}
                className="bg-success rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Rehabilitar cuenta
              </button>
            )}
            <button
              onClick={() => setConfirm("delete")}
              className="bg-danger rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Eliminar cuenta
            </button>
          </div>
        ) : (
          <div className="bg-fill rounded-xl p-4">
            <p className="text-text mb-3 text-sm font-medium">{CONFIRM_TEXT[confirm]}</p>
            <div className="flex gap-2">
              <button
                onClick={() => mutate.mutate(confirm)}
                disabled={mutate.isPending}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50",
                  confirm === "enable" ? "bg-success" : "bg-danger",
                )}
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="border-border text-text-muted rounded-xl border px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
