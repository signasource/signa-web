import { z } from "zod";
import type { AdminUser, UpdateAdminInput } from "@/lib/api/admin";

/** Longest side of the stored photo, in pixels. */
export const AVATAR_MAX_SIDE = 256;
/** Largest file we are willing to decode before resizing. */
export const AVATAR_MAX_FILE_BYTES = 8 * 1024 * 1024;

export const adminProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Ingresá el nombre.").max(100, "Máximo 100 caracteres."),
    lastName: z.string().trim().min(1, "Ingresá el apellido.").max(100, "Máximo 100 caracteres."),
    email: z.string().trim().min(1, "Ingresá el email.").email("Ingresá un email válido."),
    password: z.string().refine((v) => v === "" || (v.length >= 8 && v.length <= 72), {
      message: "La contraseña debe tener entre 8 y 72 caracteres.",
    }),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export type AdminProfileValues = z.infer<typeof adminProfileSchema>;

/** `undefined` keeps the photo, a data URL replaces it, `null` removes it. */
export type AvatarChange = string | null | undefined;

/** Builds the PATCH body with only what changed; null when nothing did. */
export function buildAdminUpdate(
  original: Pick<AdminUser, "name" | "lastName" | "email">,
  values: AdminProfileValues,
  avatar: AvatarChange,
): UpdateAdminInput | null {
  const body: UpdateAdminInput = {};
  const name = values.name.trim();
  const lastName = values.lastName.trim();
  const email = values.email.trim();
  if (name !== original.name) body.name = name;
  if (lastName !== original.lastName) body.lastName = lastName;
  if (email.toLowerCase() !== original.email.toLowerCase()) body.email = email;
  if (values.password !== "") body.password = values.password;
  if (avatar !== undefined) body.avatar = avatar ?? "";
  return Object.keys(body).length > 0 ? body : null;
}

/** Size that fits `width × height` inside `max × max`, keeping the ratio and never upscaling. */
export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Two-letter fallback shown when there is no photo. */
export function adminInitials(name: string, lastName: string) {
  return `${name.trim()[0] ?? ""}${lastName.trim()[0] ?? ""}`.toUpperCase() || "?";
}
