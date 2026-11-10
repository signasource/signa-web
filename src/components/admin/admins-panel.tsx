"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { AvatarPicker } from "@/components/admin/avatar-picker";
import { EditAdminForm } from "@/components/admin/edit-admin-form";
import { createAdminSchema, type CreateAdminValues } from "@/lib/admin-profile";
import { adminApi } from "@/lib/api/admin";

const inputClass =
  "border-border bg-fill focus:border-primary rounded-xl border px-3 py-2 outline-none";

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-danger text-xs font-normal">{message}</span> : null;
}

function CreateAdminForm({ onSuccess }: { onSuccess: () => void }) {
  const qc = useQueryClient();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateAdminValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { name: "", lastName: "", email: "", password: "" },
  });
  const [name, lastName] = useWatch({ control, name: ["name", "lastName"] });

  const create = useMutation({
    mutationFn: (values: CreateAdminValues) =>
      adminApi.createAdmin({ ...values, ...(avatar ? { avatar } : {}) }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "admins"] }),
        qc.invalidateQueries({ queryKey: ["admin", "users"] }),
      ]);
      onSuccess();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Error al crear el administrador.");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        setError(null);
        create.mutate(values);
      })}
      className="border-border bg-surface space-y-4 rounded-2xl border p-6"
      noValidate
    >
      <h2 className="font-display text-text text-lg font-bold">Nuevo administrador</h2>
      <AvatarPicker
        name={name ?? ""}
        lastName={lastName ?? ""}
        value={avatar}
        onChange={setAvatar}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-text flex flex-col gap-1 text-sm font-medium">
          Nombre
          <input {...register("name")} className={inputClass} />
          <FieldError message={errors.name?.message} />
        </label>
        <label className="text-text flex flex-col gap-1 text-sm font-medium">
          Apellido
          <input {...register("lastName")} className={inputClass} />
          <FieldError message={errors.lastName?.message} />
        </label>
      </div>
      <label className="text-text flex flex-col gap-1 text-sm font-medium">
        Email
        <input type="email" {...register("email")} className={inputClass} />
        <FieldError message={errors.email?.message} />
      </label>
      <label className="text-text flex flex-col gap-1 text-sm font-medium">
        Contraseña temporal
        <input
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className={inputClass}
        />
        <FieldError message={errors.password?.message} />
      </label>
      {error && <p className="text-danger text-sm">{error}</p>}
      <button
        type="submit"
        disabled={create.isPending}
        className="bg-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {create.isPending ? "Creando…" : "Crear administrador"}
      </button>
    </form>
  );
}

/** Back-office admins: list with photo, create (with photo) and edit. Lives in Usuarios. */
export function AdminsPanel() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: adminApi.admins,
  });

  const editing = data?.find((a) => a.id === editingId) ?? null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-text-muted text-sm">Cuentas con acceso total al panel.</p>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm((v) => !v);
          }}
          className="bg-primary shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {showForm ? "Cancelar" : "+ Nuevo administrador"}
        </button>
      </div>

      {showForm && (
        <div className="my-6">
          <CreateAdminForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {editing && (
        <div className="my-6">
          <EditAdminForm key={editing.id} admin={editing} onDone={() => setEditingId(null)} />
        </div>
      )}

      <div className="mt-4">
        {error ? (
          <p className="text-danger">No pudimos cargar los administradores.</p>
        ) : isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-fill h-16 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="border-border bg-surface overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border bg-fill text-text-muted border-b">
                  <th className="px-5 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-5 py-3 text-left font-semibold">Email</th>
                  <th className="px-5 py-3 text-left font-semibold">Usuario</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-text-muted px-5 py-8 text-center">
                      No hay administradores.
                    </td>
                  </tr>
                )}
                {data.map((admin) => (
                  <tr key={admin.id} className="border-border border-b last:border-0">
                    <td className="text-text px-5 py-4 font-semibold">
                      <div className="flex items-center gap-3">
                        <AdminAvatar
                          name={admin.name}
                          lastName={admin.lastName}
                          avatar={admin.avatar}
                        />
                        {admin.name} {admin.lastName}
                      </div>
                    </td>
                    <td className="text-text-muted px-5 py-4">{admin.email}</td>
                    <td className="text-text-muted px-5 py-4">@{admin.username}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setEditingId(admin.id);
                        }}
                        aria-label={`Editar a ${admin.name} ${admin.lastName}`}
                        className="text-primary text-sm font-semibold hover:underline"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
