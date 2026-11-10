"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { useAdminAuth } from "@/features/admin/admin-auth-context";
import { adminApi, type AdminUser, type UserRole } from "@/lib/api/admin";
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

export function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const qc = useQueryClient();
  const { admin } = useAdminAuth();
  const [confirm, setConfirm] = useState<Action | null>(null);
  const isSelf = admin?.id === user.id;

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
      <div className="bg-surface w-full max-w-md rounded-2xl p-6 shadow-2xl">
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

        <dl className="mb-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-text-muted text-xs">Rol</dt>
            <dd className="mt-1">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  ROLE_COLORS[user.role],
                )}
              >
                {ROLE_LABELS[user.role]}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">Acceso</dt>
            <dd className="text-text mt-1 text-xs font-medium">
              {user.authProvider === "GOOGLE" ? "Google" : "Email"}
              {" · "}
              <span className={user.verified ? "text-success-dark" : "text-warning"}>
                {user.verified ? "verificado" : "sin verificar"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">Estado</dt>
            <dd
              className={cn(
                "mt-1 text-xs font-medium",
                user.enabled ? "text-success-dark" : "text-danger",
              )}
            >
              {user.enabled ? "Habilitada" : "Deshabilitada"}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">Racha</dt>
            <dd className="text-text mt-1 text-xs font-medium">{user.currentStreak} días</dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">Última actividad</dt>
            <dd className="text-text mt-1 text-xs font-medium">
              {relativeDate(user.lastStreakDate)}
            </dd>
          </div>
          {user.organizationName && (
            <div className="col-span-2">
              <dt className="text-text-muted text-xs">Organización</dt>
              <dd className="text-text mt-1 text-xs font-medium">{user.organizationName}</dd>
            </div>
          )}
        </dl>

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
