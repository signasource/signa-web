"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { useAdminAuth } from "@/features/admin/admin-auth-context";
import {
  adminProfileSchema,
  buildAdminUpdate,
  type AdminProfileValues,
  type AvatarChange,
} from "@/lib/admin-profile";
import { adminApi, type AdminUser } from "@/lib/api/admin";
import { imageFileToAvatarDataUrl } from "@/lib/image-resize";

const inputClass =
  "border-border bg-fill focus:border-primary rounded-xl border px-3 py-2 outline-none";

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-danger text-xs font-normal">{message}</span> : null;
}

/** Edit an admin's name, email, password and photo. Only the fields that changed are sent. */
export function EditAdminForm({ admin, onDone }: { admin: AdminUser; onDone: () => void }) {
  const qc = useQueryClient();
  const { admin: me, refresh } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarChange, setAvatarChange] = useState<AvatarChange>(undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminProfileValues>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: {
      name: admin.name,
      lastName: admin.lastName,
      email: admin.email,
      password: "",
      confirmPassword: "",
    },
  });

  const shownAvatar = avatarChange === undefined ? admin.avatar : avatarChange;

  const save = useMutation({
    mutationFn: (values: AdminProfileValues) => {
      const body = buildAdminUpdate(admin, values, avatarChange);
      if (!body) return Promise.resolve(null);
      return adminApi.updateAdmin(admin.id, body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "admins"] });
      // The header shows the signed-in admin's own name and photo.
      if (me?.id === admin.id) await refresh();
      onDone();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "No pudimos guardar los cambios.");
    },
  });

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    try {
      setAvatarChange(await imageFileToAvatarDataUrl(file));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "No pudimos usar esa imagen.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit((values) => {
        setError(null);
        save.mutate(values);
      })}
      className="border-border bg-surface space-y-4 rounded-2xl border p-6"
      noValidate
    >
      <h2 className="font-display text-text text-lg font-bold">
        Editar a {admin.name} {admin.lastName}
      </h2>

      <div className="flex items-center gap-4">
        <AdminAvatar
          name={admin.name}
          lastName={admin.lastName}
          avatar={shownAvatar}
          className="size-16 text-lg"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
            aria-label="Elegir foto"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="border-border text-text hover:bg-fill rounded-xl border px-3 py-1.5 text-sm font-semibold"
          >
            {shownAvatar ? "Cambiar foto" : "Subir foto"}
          </button>
          {shownAvatar && (
            <button
              type="button"
              onClick={() => setAvatarChange(null)}
              className="text-danger rounded-xl px-3 py-1.5 text-sm font-semibold hover:underline"
            >
              Quitar foto
            </button>
          )}
        </div>
      </div>
      {photoError && <p className="text-danger text-sm">{photoError}</p>}

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

      <fieldset className="space-y-3">
        <legend className="text-text-muted text-xs">
          Dejá la contraseña vacía para no cambiarla. Si la cambiás, se cierran sus otras sesiones.
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-text flex flex-col gap-1 text-sm font-medium">
            Nueva contraseña
            <input
              type="password"
              autoComplete="new-password"
              {...register("password")}
              className={inputClass}
            />
            <FieldError message={errors.password?.message} />
          </label>
          <label className="text-text flex flex-col gap-1 text-sm font-medium">
            Repetir contraseña
            <input
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={inputClass}
            />
            <FieldError message={errors.confirmPassword?.message} />
          </label>
        </div>
      </fieldset>

      {error && <p className="text-danger text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="bg-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Guardando…" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-text-muted hover:bg-fill rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
