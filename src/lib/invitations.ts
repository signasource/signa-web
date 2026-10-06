import { z } from "zod";
import { isEmail, parseEmails } from "@/lib/dashboard-format";

export const inviteEmailsSchema = z.object({
  emails: z.string().superRefine((raw, ctx) => {
    const list = parseEmails(raw);
    if (list.length === 0) {
      ctx.addIssue({ code: "custom", message: "Ingresá al menos un email." });
      return;
    }
    const bad = list.find((e) => !isEmail(e));
    if (bad) ctx.addIssue({ code: "custom", message: `«${bad}» no parece un email válido.` });
  }),
});

export type InviteEmailsForm = z.infer<typeof inviteEmailsSchema>;
