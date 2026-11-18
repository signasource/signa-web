import { api } from "@/lib/api/client";
import type { SignMedia } from "@/lib/api/types";

export const signsApi = {
  /**
   * Which file each sign uses (`POST /signs/media`). The API resolves names (case, accents,
   * aliases like niño → nene) against the R2 bucket; signs with no file are left out of the list,
   * and the list is not in request order. Needs a session (the preview runs inside the panel).
   */
  media: (meanings: string[]) =>
    api<SignMedia[]>("/signs/media", { method: "POST", body: { meanings } }),
};
