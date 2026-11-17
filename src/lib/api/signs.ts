import { api } from "@/lib/api/client";
import type { SignMedia } from "@/lib/api/types";

/** The API refuses more than this many meanings per `POST /signs/media`. */
export const SIGN_MEDIA_BATCH = 200;

export const signsApi = {
  /** Where each sign's animation lives. Signs without an uploaded file are left out. */
  media: (meanings: string[]) =>
    api<SignMedia[]>("/signs/media", { method: "POST", body: { meanings } }),
};
