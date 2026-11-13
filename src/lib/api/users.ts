import { api } from "@/lib/api/client";
import type { UserProfile } from "@/lib/api/types";

export const usersApi = {
  me: () => api<UserProfile>("/users/me"),

  /** `avatar` is a PNG/JPEG/WebP data URL (the browser resizes it first); returns the new profile. */
  setAvatar: (avatar: string) =>
    api<UserProfile>("/users/me/avatar", { method: "PUT", body: { avatar } }),

  removeAvatar: () => api<UserProfile>("/users/me/avatar", { method: "DELETE" }),
};
