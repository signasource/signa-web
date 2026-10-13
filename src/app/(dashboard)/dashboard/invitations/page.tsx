"use client";

import * as XLSX from "xlsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
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
type ExcelPhase = "idle" | "preview";

function usesLabel(code: InviteCode) {
  const uses = code.useCount === 1 ? "1 uso" : `${code.useCount} usos`;
  return code.maxUses ? `${uses} de ${code.maxUses}` : uses;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractEmails(headers: string[], dataRows: string[][], col: string): string[] {
  const idx = headers.indexOf(col);
  if (idx === -1) return [];
  return dataRows.map((row) => String(row[idx] ?? "").trim()).filter((v) => v !== "");
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

  // Excel state
  const [excelPhase, setExcelPhase] = useState<ExcelPhase>("idle");
  const [excelFileName, setExcelFileName] = useState("");
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelDataRows, setExcelDataRows] = useState<string[][]>([]);
  const [emailColumn, setEmailColumn] = useState("");
  const [excelError, setExcelError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExcelInvite, setIsExcelInvite] = useState(false);
  const datalistId = useId();

  const flash = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const resetExcel = () => {
    setExcelPhase("idle");
    setExcelFileName("");
    setExcelHeaders([]);
    setExcelDataRows([]);
    setEmailColumn("");
    setExcelError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      if (isExcelInvite) {
        resetExcel();
        setIsExcelInvite(false);
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelError(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("El archivo no tiene hojas.");
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      if (rows.length < 2) throw new Error("El archivo no tiene datos.");
      const headers = (rows[0] as unknown[]).map(String);
      if (headers.length === 0) throw new Error("No se encontraron columnas.");
      const dataRows = (rows.slice(1) as unknown[][]).map((r) =>
        headers.map((_, i) => String((r as unknown[])[i] ?? "")),
      );
      const autoCol = headers.find((h) => h.toLowerCase().includes("mail")) ?? headers[0] ?? "";
      setExcelHeaders(headers);
      setExcelDataRows(dataRows);
      setEmailColumn(autoCol);
      setExcelFileName(file.name);
      setExcelPhase("preview");
    } catch (err) {
      setExcelError(
        err instanceof Error ? err.message : "No pudimos leer el archivo. Verificá el formato.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Derived data for the preview
  const allEmails = extractEmails(excelHeaders, excelDataRows, emailColumn);
  const emailRows = allEmails.map((e) => ({ email: e, valid: isValidEmail(e) }));
  const validEmails = emailRows.filter((r) => r.valid).map((r) => r.email);
  const invalidCount = emailRows.length - validEmails.length;
  const previewRows = emailRows.slice(0, 20);
  const overflowCount = emailRows.length - previewRows.length;

  return (
    <section className="flex flex-col gap-5">
      <PageHeading
        title="Invitaciones"
        subtitle={`Quien acepta la invitación se suma a ${organization?.name} y accede a los contenidos contratados desde su cuenta de Signa.`}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
        {/* ── Invitar por email ── */}
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
              {invite.isPending && !isExcelInvite ? "Enviando…" : "Enviar invitaciones"}
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

        {/* ── Códigos de invitación ── */}
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

        {/* ── Importar desde Excel ── */}
        <Card className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <SectionIcon name="upload" className="bg-shop-amber-light text-shop-amber-dark" />
            <CardTitle>Importar desde Excel</CardTitle>
          </div>

          {excelPhase === "idle" && (
            <>
              <p className="text-text-muted text-sm text-pretty">
                Subí un archivo con una columna de emails para invitar a varias personas a la vez.
              </p>
              <div className="border-border rounded-2xl border border-dashed p-6 text-center">
                <Icon name="upload" className="text-text-muted mx-auto mb-3 size-8" />
                <p className="text-sm font-semibold">Subir lista de emails</p>
                <p className="text-text-muted mt-1 text-[13px]">Formatos: .xlsx, .xls, .csv</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${pillButton} mx-auto mt-4`}
                >
                  Elegir archivo
                </button>
              </div>
              {excelError ? <ErrorState>{excelError}</ErrorState> : null}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          )}

          {excelPhase === "preview" && (
            <>
              <p className="text-text-muted truncate text-[13px]">
                Archivo: <span className="text-text font-semibold">{excelFileName}</span>
              </p>

              {/* Column selector */}
              <label className="flex flex-col gap-1 text-sm font-medium">
                Columna con emails
                <input
                  list={datalistId}
                  value={emailColumn}
                  onChange={(e) => setEmailColumn(e.target.value)}
                  placeholder="ej: Email, Correo, mail..."
                  className="border-border bg-surface rounded-lg border px-3 py-2 text-[15px]"
                />
                <datalist id={datalistId}>
                  {excelHeaders.map((h) => (
                    <option key={h} value={h} />
                  ))}
                </datalist>
                <span className="text-text-muted text-[13px] font-normal">
                  Elegí del listado o escribí el nombre exacto de la columna.
                </span>
              </label>

              {/* Preview table */}
              {emailRows.length > 0 ? (
                <div className="border-border overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-fill text-text-muted text-xs font-extrabold tracking-wider">
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-fill border-t">
                          <td className="max-w-[240px] truncate px-3 py-2 font-medium">
                            {row.email || <span className="text-text-muted italic">vacío</span>}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span
                              className={
                                row.valid
                                  ? "bg-success-light text-success-dark rounded-full px-2 py-0.5 text-xs font-extrabold"
                                  : "bg-danger-light text-danger rounded-full px-2 py-0.5 text-xs font-extrabold"
                              }
                            >
                              {row.valid ? "Válido" : "Inválido"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {overflowCount > 0 ? (
                    <p className="text-text-muted border-fill border-t px-3 py-2 text-[13px]">
                      …y {overflowCount} más
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-text-muted text-sm">
                  No se encontraron valores en la columna seleccionada.
                </p>
              )}

              {/* Summary */}
              <p className="text-sm font-semibold">
                <span className="text-success-dark">{validEmails.length} emails válidos</span>
                {invalidCount > 0 ? (
                  <span className="text-text-muted"> · {invalidCount} inválidos</span>
                ) : null}
              </p>

              {/* Actions */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={resetExcel}
                  disabled={invite.isPending && isExcelInvite}
                  className={pillButton}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={validEmails.length === 0 || invite.isPending}
                  onClick={() => {
                    setIsExcelInvite(true);
                    invite.mutate(validEmails);
                  }}
                  className={primaryButton}
                >
                  {invite.isPending && isExcelInvite
                    ? "Enviando…"
                    : `Enviar ${validEmails.length} invitación${validEmails.length !== 1 ? "es" : ""}`}
                </button>
              </div>
            </>
          )}
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
