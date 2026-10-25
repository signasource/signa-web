"use client";

import * as XLSX from "xlsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { ApiError } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import type { PurchaseCatalog } from "@/lib/api/types";
import { isEmail } from "@/lib/dashboard-format";
import {
  emailsFromSheet,
  formatMoney,
  purchaseFormSchema,
  uniqueEmails,
  type PurchaseForm,
} from "@/lib/purchases";
import { cn } from "@/lib/utils";

const DURATION_PRESETS = [15, 30, 45, 60];

function PurchaseFormView({ catalog }: { catalog: PurchaseCatalog }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;
  const fileInput = useRef<HTMLInputElement>(null);
  const [sheetMessage, setSheetMessage] = useState<string | null>(null);

  const schema = useMemo(() => purchaseFormSchema(catalog), [catalog]);
  const form = useForm<PurchaseForm>({
    resolver: zodResolver(schema),
    defaultValues: { courseId: catalog.courses[0]?.id ?? "", durationDays: 30, emails: "" },
  });
  const [courseId, durationDays, rawEmails] = useWatch({
    control: form.control,
    name: ["courseId", "durationDays", "emails"],
  });
  const emails = uniqueEmails(rawEmails ?? "").filter(isEmail);
  const seats = emails.length;
  const validDuration =
    Number.isInteger(durationDays) &&
    durationDays >= catalog.minDays &&
    durationDays <= catalog.maxDays;

  const quote = useQuery({
    queryKey: ["purchase-quote", courseId, Math.max(seats, 1), durationDays],
    queryFn: () => organizationsApi.quote({ courseId, seats: Math.max(seats, 1), durationDays }),
    enabled: Boolean(courseId) && validDuration && seats <= catalog.maxSeats,
    placeholderData: keepPreviousData,
  });

  const create = useMutation({
    mutationFn: (values: PurchaseForm) =>
      organizationsApi.createPurchase(orgId!, {
        courseId: values.courseId,
        durationDays: values.durationDays,
        emails: uniqueEmails(values.emails),
      }),
    onSuccess: async (detail) => {
      await queryClient.invalidateQueries({ queryKey: ["organization", orgId, "purchases"] });
      router.push(`/dashboard/purchases/${detail.purchase.id}`);
    },
  });

  async function importSheet(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSheetMessage(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
      if (!sheet) throw new Error();
      const found = emailsFromSheet(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 }));
      if (found.length === 0) {
        setSheetMessage("No encontramos emails válidos en el archivo.");
      } else {
        const merged = uniqueEmails(`${form.getValues("emails")}\n${found.join("\n")}`);
        form.setValue("emails", merged.join("\n"), { shouldValidate: true });
        setSheetMessage(
          `Sumamos ${found.length} ${found.length === 1 ? "email" : "emails"} de ${file.name}.`,
        );
      }
    } catch {
      setSheetMessage("No pudimos leer el archivo. Verificá el formato.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const createError =
    create.error instanceof ApiError && create.error.status === 409
      ? "Alguno de esos emails ya tiene un cupo pendiente o vigente para este curso."
      : create.error
        ? "No pudimos crear la compra. Probá de nuevo."
        : null;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => create.mutate(values))}
      className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4"
    >
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <SectionIcon name="book" className="bg-primary-light text-primary-dark" />
            <CardTitle>Curso</CardTitle>
          </div>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Curso">
            {catalog.courses.map((course) => (
              <label
                key={course.id}
                className={cn(
                  "border-border flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4",
                  courseId === course.id && "border-primary bg-primary-light/40",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={course.id}
                    className="accent-primary size-4"
                    {...form.register("courseId")}
                  />
                  <span className="flex flex-col">
                    <span className="font-bold">{course.name}</span>
                    <span className="text-text-muted text-[13px]">{course.signCount} señas</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
          {form.formState.errors.courseId ? (
            <span role="alert" className="text-danger text-sm">
              {form.formState.errors.courseId.message}
            </span>
          ) : null}
        </Card>

        <Card className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <SectionIcon name="calendar" className="bg-course-teal-light text-avatar-teal-dark" />
            <CardTitle>Duración del acceso</CardTitle>
          </div>
          <p className="text-text-muted text-sm text-pretty">
            Entre {catalog.minDays} y {catalog.maxDays} días. Cada persona tiene sus propios días,
            que empiezan a correr cuando acepta la invitación.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {DURATION_PRESETS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => form.setValue("durationDays", days, { shouldValidate: true })}
                className={cn(
                  pillButton,
                  durationDays === days && "border-primary bg-primary-light text-primary-dark",
                )}
              >
                {days} días
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm font-medium">
              Otra:
              <input
                type="number"
                min={catalog.minDays}
                max={catalog.maxDays}
                aria-invalid={Boolean(form.formState.errors.durationDays)}
                className="border-border bg-surface w-20 rounded-lg border px-3 py-2 text-[15px]"
                {...form.register("durationDays", { valueAsNumber: true })}
              />
            </label>
          </div>
          {form.formState.errors.durationDays ? (
            <span role="alert" className="text-danger text-sm">
              {form.formState.errors.durationDays.message}
            </span>
          ) : null}
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <SectionIcon name="mail" className="bg-shop-amber-light text-shop-amber-dark" />
              <CardTitle>Emails de las personas</CardTitle>
            </div>
            <button type="button" className={pillButton} onClick={() => fileInput.current?.click()}>
              <Icon name="upload" className="size-4" />
              Importar Excel
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={importSheet}
            />
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Un email por cupo
            <textarea
              rows={7}
              placeholder={"nombre@empresa.com\notra@empresa.com"}
              aria-invalid={Boolean(form.formState.errors.emails)}
              className="border-border bg-surface resize-y rounded-lg border px-3 py-2 text-[15px]"
              {...form.register("emails")}
            />
            <span className="text-text-muted text-[13px] font-normal">
              Separá los emails con comas o saltos de línea. La invitación solo la puede aceptar la
              cuenta de ese email.
            </span>
          </label>
          {sheetMessage ? <p className="text-text-muted text-[13px]">{sheetMessage}</p> : null}
          {form.formState.errors.emails ? (
            <span role="alert" className="text-danger text-sm">
              {form.formState.errors.emails.message}
            </span>
          ) : null}
        </Card>

        <Card className="flex flex-col gap-3">
          <CardTitle>Resumen</CardTitle>
          {quote.data ? (
            <dl className="flex flex-col text-sm">
              <div className="border-fill flex justify-between border-b py-2">
                <dt className="text-text-muted">Precio por cupo</dt>
                <dd className="font-extrabold">
                  {formatMoney(quote.data.pricePerSeat, quote.data.currency)}
                </dd>
              </div>
              <div className="border-fill flex justify-between border-b py-2">
                <dt className="text-text-muted">Cupos</dt>
                <dd className="font-extrabold">{seats}</dd>
              </div>
              <div className="flex items-baseline justify-between py-2">
                <dt className="text-text-muted">Total</dt>
                <dd className="font-display text-2xl font-extrabold">
                  {formatMoney(quote.data.pricePerSeat * seats, quote.data.currency)}
                </dd>
              </div>
            </dl>
          ) : quote.isFetching ? (
            <LoadingState />
          ) : (
            <p className="text-text-muted text-sm">
              Elegí el curso y la duración para ver el precio.
            </p>
          )}
          <p className="text-text-muted text-[13px] text-pretty">
            La compra queda pendiente de pago. Cuando se confirme, les mandamos la invitación y
            tienen {catalog.invitationDays} días para aceptarla.
          </p>
          {createError ? <ErrorState>{createError}</ErrorState> : null}
          <button
            type="submit"
            disabled={create.isPending || seats === 0}
            className={primaryButton}
          >
            {create.isPending
              ? "Creando la compra…"
              : `Comprar ${seats} ${seats === 1 ? "cupo" : "cupos"}`}
          </button>
        </Card>
      </div>
    </form>
  );
}

export default function NewPurchasePage() {
  const { organization } = useAuth();
  const catalog = useQuery({
    queryKey: ["purchase-catalog"],
    queryFn: organizationsApi.catalog,
  });

  return (
    <section className="flex flex-col gap-5">
      <Link
        href="/dashboard/purchases"
        className="text-text-muted inline-flex items-center gap-1 text-sm font-bold hover:underline"
      >
        <Icon name="chevronBack" className="size-4" />
        Compras
      </Link>
      <PageHeading
        title="Comprar cupos"
        subtitle="Cada cupo es para una persona y un curso. Si querés dar acceso a dos cursos, comprá cupos para cada uno."
      />
      {organization?.status !== "ACTIVE" ? (
        <ErrorState>Vas a poder comprar cupos apenas SIGNA valide tu organización.</ErrorState>
      ) : catalog.isPending ? (
        <LoadingState />
      ) : catalog.error ? (
        <ErrorState>No pudimos cargar los datos.</ErrorState>
      ) : catalog.data.courses.length === 0 ? (
        <ErrorState>Todavía no hay cursos disponibles para comprar.</ErrorState>
      ) : (
        <PurchaseFormView catalog={catalog.data} />
      )}
    </section>
  );
}
