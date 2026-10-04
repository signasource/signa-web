import { api } from "@/lib/api/client";

export const authApi = {
  forgotPassword: (email: string) =>
    api("/auth/forgot-password", { method: "POST", body: { email }, anonymous: true }),

  resetPassword: (token: string, newPassword: string) =>
    api("/auth/reset-password", {
      method: "POST",
      query: { token },
      body: { newPassword },
      anonymous: true,
    }),
};
