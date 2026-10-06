"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Icon } from "@/components/dashboard/icons";
import {
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeading,
  SectionIcon,
  pillButton,
  primaryButton,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import type { InviteCode } from "@/lib/api/types";
import { formatDate, parseEmails } from "@/lib/dashboard-format";
import { inviteEmailsSchema, type InviteEmailsForm } from "@/lib/invitations";

type SentInvite = { email: string; ok: boolean };

function usesLabel(code: InviteCode) {
  const uses = code.useCount === 1 ? "1 uso" : `${code.useCount} usos`;
  return code.maxUses ? `${uses} de ${code.maxUses}` : uses;
}

export default function InvitationsPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const codesKey = ["organization", orgId, "invite-codes"];

  const [sent, setSent] = useState<SentInvite[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const flash = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const form = useForm<InviteEmailsForm>({
    resolver: zodResolver(inviteEmailsSchema),
    defaultValues: { emails: "" },
  });

  const codes = useQuery({
    queryKey: codesKey,
    queryFn: () => organizationsApi.inviteCodes(orgId!),
    enabled: Boolean(orgId),
  });
  const shareable = (codes.data ?? []).filter((c) => c.active && c.email === null);

  const invite = useMutation({
    mutationFn: async (emails: string[]) =>
      Promise.all(
        emails.map(async (email): Promise<SentInvite> => {
          try {
            await organizationsApi.inviteByEmail(orgId!, email);
            return { email, ok: true };
          } catch {
            return { email, ok: false };
          }
        }),
      ),
    onSuccess: (results) => {
      setSent((prev) => [...results, ...prev]);
      const okCount = results.filter((r) => r.ok).length;
      if (okCount > 0) {
        form.reset({ emails: "" });
        flash(okCount === 1 ? "Enviamos la invitación" : `Enviamos ${okCount} invitaciones`);
      }
      if (okCount < results.length) {
        form.setError("emails", { message: "No pudimos enviar algunas invitaciones." });
      }
    },
  });

  const createCode = useMutation({
    mutationFn: () => organizationsApi.createInviteCode(orgId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: codesKey });
      flash("Código creado");
    },
  });

  const revokeCode = useMutation({
    mutationFn: (id: string) => organizationsApi.deactivateInviteCode(orgId!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: codesKey });
      flash("Código revocado");
    },
  });

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800);
  };

  return (
    <section className="flex flex-col gap-5">
      <PageHeading
        title="Invitaciones"
        subtitle={`Quien acepta la invitación se suma a ${organization?.name} y accede a los contenidos contratados desde su cuenta de Signa.`}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
        <Card className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <SectionIcon name="mail" className="bg-primary-light text-primary-dark" />
            <CardTitle>Invitar por email</CardTitle>
          </div>
          <form
            noValidate
            onSubmit={form.handleSubmit((values) => invite.mutate(parseEmails(values.emails)))}
            className="flex flex-col gap-3.5"
          >
            <label className="flex flex-col gap-1 text-sm font-medium">
              Emails
              <textarea
                rows={4}
                placeholder="nombre@empresa.com, otra@empresa.com"
                aria-invalid={Boolean(form.formState.errors.emails)}
                className="border-border bg-surface resize-y rounded-lg border px-3 py-2 text-[15px]"
                {...form.register("emails")}
              />
              <span className="text-text-muted text-[13px] font-normal">
                Separá los emails con comas o saltos de línea.
              </span>
            </label>
            {form.formState.errors.emails ? (
              <span role="alert" className="text-danger text-sm">
                {form.formState.errors.emails.message}
              </span>
            ) : null}
            <button type="submit" disabled={invite.isPending} className={primaryButton}>
              {invite.isPending ? "Enviando…" : "Enviar invitaciones"}
            </button>
          </form>
          {sent.length > 0 ? (
            <div className="border-border flex flex-col border-t pt-1.5">
              <span className="text-text-muted py-2 text-xs font-extrabold tracking-wider">
                ENVIADAS RECIÉN
              </span>
              <ul>
                {sent.map((s, i) => (
                  <li
                    key={`${s.email}-${i}`}
                    className="border-fill flex justify-between gap-3 border-b py-2 text-sm"
                  >
                    <span className="truncate font-semibold">{s.email}</span>
                    <span
                      className={
                        s.ok
                          ? "bg-success-light text-success-dark rounded-full px-2.5 py-0.5 text-xs font-extrabold"
                          : "bg-danger-light text-danger rounded-full px-2.5 py-0.5 text-xs font-extrabold"
                      }
                    >
                      {s.ok ? "Enviada" : "No se envió"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <SectionIcon name="key" className="bg-course-teal-light text-avatar-teal-dark" />
              <CardTitle>Códigos de invitación</CardTitle>
            </div>
            <button
              type="button"
              className={pillButton}
              disabled={createCode.isPending}
              onClick={() => createCode.mutate()}
            >
              <Icon name="add" className="size-4" />
              Crear código
            </button>
          </div>
          <p className="text-text-muted text-sm text-pretty">
            Compartilo con tu equipo: lo ingresan en la app para sumarse.
          </p>
          {codes.isPending ? <LoadingState /> : null}
          {codes.error ? <ErrorState>No pudimos cargar los códigos.</ErrorState> : null}
          {createCode.error || revokeCode.error ? (
            <ErrorState>No pudimos completar la acción. Probá de nuevo.</ErrorState>
          ) : null}
          {shareable.map((c) => (
            <div
              key={c.id}
              className="bg-background border-border flex flex-col gap-2.5 rounded-2xl border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span className="font-display text-2xl font-extrabold tracking-wider">
                  {c.code}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => copy(c.code)}
                    className="bg-text text-on-dark flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold"
                  >
                    <Icon name={copied === c.code ? "check" : "copy"} className="size-[15px]" />
                    {copied === c.code ? "Copiado" : "Copiar"}
                  </button>
                  <button
                    type="button"
                    disabled={revokeCode.isPending}
                    onClick={() => revokeCode.mutate(c.id)}
                    className={`${pillButton} text-danger`}
                  >
                    Revocar
                  </button>
                </div>
              </div>
              <span className="text-text-muted text-[13px]">
                {usesLabel(c)} ·{" "}
                {c.expiresAt ? `Vence el ${formatDate(c.expiresAt)}` : "Sin vencimiento"}
              </span>
            </div>
          ))}
          {codes.data && shareable.length === 0 ? (
            <p className="text-text-muted border-fill-dark rounded-2xl border border-dashed p-4 text-center text-sm">
              No hay códigos activos.
            </p>
          ) : null}
        </Card>
      </div>

      {toast ? (
        <div
          role="status"
          className="bg-text text-on-dark fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-lg"
        >
          <Icon name="checkCircle" className="text-success" />
          {toast}
        </div>
      ) : null}
    </section>
  );
}
