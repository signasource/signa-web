"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { EditAdminForm } from "@/components/admin/edit-admin-form";
import { useAdminAuth } from "@/features/admin/admin-auth-context";
import { ROLE_LABELS } from "@/features/admin/user-detail-modal";
import { adminApi } from "@/lib/api/admin";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-muted text-xs font-semibold tracking-wide uppercase">{label}</dt>
      <dd className="text-text mt-0.5 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { admin: me } = useAdminAuth();
  const [editing, setEditing] = useState(false);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "users", me?.id],
    queryFn: () => adminApi.user(me!.id),
    enabled: !!me,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-text text-2xl font-bold">Perfil</h1>
        <p className="text-text-muted mt-0.5 text-sm">Tu cuenta de administración de Signa.</p>
      </div>

      {error ? (
        <p className="text-danger">No pudimos cargar tu perfil.</p>
      ) : isPending ? (
        <p className="text-text-muted">Cargando…</p>
      ) : editing ? (
        <EditAdminForm admin={data} onDone={() => setEditing(false)} />
      ) : (
        <section className="border-border bg-surface rounded-2xl border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AdminAvatar
                name={data.name}
                lastName={data.lastName}
                avatar={data.avatar}
                className="size-20 text-2xl"
              />
              <div>
                <h2 className="font-display text-text text-xl font-bold">
                  {data.name} {data.lastName}
                </h2>
                <p className="text-text-muted text-sm">@{data.username}</p>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="bg-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Editar
            </button>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Fact label="Email" value={data.email} />
            <Fact label="Rol" value={ROLE_LABELS[data.role]} />
            <Fact
              label="Inicio de sesión"
              value={data.authProvider === "GOOGLE" ? "Google" : "Email y contraseña"}
            />
            <Fact label="Contraseña" value="••••••••" />
          </dl>
        </section>
      )}
    </div>
  );
}
