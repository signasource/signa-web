"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";

function CreateAdminForm({ onSuccess }: { onSuccess: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: "", name: "", lastName: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const mutate = useMutation({
    mutationFn: () => adminApi.createAdmin(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "admins"] });
      setForm({ email: "", name: "", lastName: "", password: "" });
      setError(null);
      onSuccess();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Error al crear el administrador.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.name || !form.lastName || !form.password) return;
    mutate.mutate();
  }

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-surface space-y-4 rounded-2xl border p-6"
    >
      <h2 className="font-display text-text text-lg font-bold">Nuevo administrador</h2>
      <div className="grid grid-cols-2 gap-4">
        <label className="text-text flex flex-col gap-1 text-sm font-medium">
          Nombre
          <input
            value={form.name}
            onChange={update("name")}
            required
            className="border-border bg-fill focus:border-primary rounded-xl border px-3 py-2 outline-none"
          />
        </label>
        <label className="text-text flex flex-col gap-1 text-sm font-medium">
          Apellido
          <input
            value={form.lastName}
            onChange={update("lastName")}
            required
            className="border-border bg-fill focus:border-primary rounded-xl border px-3 py-2 outline-none"
          />
        </label>
      </div>
      <label className="text-text flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          type="email"
          value={form.email}
          onChange={update("email")}
          required
          className="border-border bg-fill focus:border-primary rounded-xl border px-3 py-2 outline-none"
        />
      </label>
      <label className="text-text flex flex-col gap-1 text-sm font-medium">
        Contraseña temporal
        <input
          type="password"
          value={form.password}
          onChange={update("password")}
          required
          minLength={8}
          className="border-border bg-fill focus:border-primary rounded-xl border px-3 py-2 outline-none"
        />
      </label>
      {error && <p className="text-danger text-sm">{error}</p>}
      <button
        type="submit"
        disabled={mutate.isPending}
        className="bg-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {mutate.isPending ? "Creando…" : "Crear administrador"}
      </button>
    </form>
  );
}

export default function AdminsPage() {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: adminApi.admins,
  });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-text text-2xl font-bold">Administradores</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-primary rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {showForm ? "Cancelar" : "+ Nuevo administrador"}
        </button>
      </div>
      <p className="text-text-muted mb-6 text-sm">Cuentas con acceso total al panel.</p>

      {showForm && (
        <div className="mb-6">
          <CreateAdminForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
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
              </tr>
            </thead>
            <tbody>
              {data?.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-text-muted px-5 py-8 text-center">
                    No hay administradores.
                  </td>
                </tr>
              )}
              {data?.map((admin) => (
                <tr key={admin.id} className="border-border border-b last:border-0">
                  <td className="text-text px-5 py-4 font-semibold">
                    {admin.name} {admin.lastName}
                  </td>
                  <td className="text-text-muted px-5 py-4">{admin.email}</td>
                  <td className="text-text-muted px-5 py-4">@{admin.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
