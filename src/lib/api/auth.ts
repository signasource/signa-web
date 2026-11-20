import { api } from "@/lib/api/client";

export const authApi = {
  /** Emails a 6-digit code (valid 15 min). The API answers the same whether or not the email exists. */
  forgotPassword: (email: string) =>
    api("/auth/forgot-password", { method: "POST", body: { email }, anonymous: true }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api("/auth/reset-password", {
      method: "POST",
      body: { email, code, newPassword },
      anonymous: true,
    }),
};
