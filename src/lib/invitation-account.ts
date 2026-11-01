import { z } from "zod";

const NAME = /^[\p{L} .'-]+$/u;

export const invitationLoginSchema = z.object({
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const invitationRegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Ingresá tu nombre.")
      .max(100)
      .regex(NAME, "Usá solo letras en el nombre."),
    lastName: z
      .string()
      .trim()
      .min(2, "Ingresá tu apellido.")
      .max(100)
      .regex(NAME, "Usá solo letras en el apellido."),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(72, "La contraseña puede tener hasta 72 caracteres."),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type InvitationLoginValues = z.infer<typeof invitationLoginSchema>;
export type InvitationRegisterValues = z.infer<typeof invitationRegisterSchema>;

export function usernameFromEmail(email: string, random: () => number = Math.random): string {
  const local = email.split("@")[0] ?? "";
  const base =
    local
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40) || "signa";
  const suffix = String(Math.floor(random() * 10_000)).padStart(4, "0");
  return `${base.length < 3 ? `${base}_user` : base}_${suffix}`;
}
