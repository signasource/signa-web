"use client";

import * as XLSX from "xlsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CourseContents, CourseHero, CourseShowcase } from "@/components/dashboard/course-preview";
import { Icon } from "@/components/dashboard/icons";
import { PurchaseInvoice } from "@/components/dashboard/purchase-invoice";
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
  DAILY_STUDY_MINUTES,
  daysToComplete,
  emailsFromSheet,
  formatMoney,
  nextVolumeDiscount,
  purchaseFormSchema,
  signsWithin,
  uniqueEmails,
  type PurchaseForm,
} from "@/lib/purchases";
import { cn } from "@/lib/utils";

const DURATION_PRESETS = [15, 30, 45, 60];

function PurchaseFormView({ catalog }: { catalog: PurchaseCatalog }) {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;
  const fileInput = useRef<HTMLInputElement>(null);
  const [sheetMessage, setSheetMessage] = useState<string | null>(null);
  const [review, setReview] = useState<PurchaseForm | null>(null);
  // Set once the purchase exists, so retrying the payment does not create a second one.
  const [createdId, setCreatedId] = useState<string | null>(null);

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
  const course = catalog.courses.find((c) => c.id === courseId);
  const validDuration =
    Number.isInteger(durationDays) &&
    durationDays >= catalog.minDays &&
    durationDays <= catalog.maxDays;
  const nextDiscount = seats > 0 ? nextVolumeDiscount(seats, catalog.volumeDiscounts) : null;

  const quote = useQuery({
    queryKey: ["purchase-quote", courseId, Math.max(seats, 1), durationDays],
    queryFn: () => organizationsApi.quote({ courseId, seats: Math.max(seats, 1), durationDays }),
    enabled: Boolean(courseId) && validDuration && seats <= catalog.maxSeats,
    placeholderData: keepPreviousData,
  });

  const reviewEmails = review ? uniqueEmails(review.emails) : [];
  const reviewQuote = useQuery({
    queryKey: ["purchase-quote", review?.courseId, reviewEmails.length, review?.durationDays],
    queryFn: () =>
      organizationsApi.quote({
        courseId: review!.courseId,
        seats: reviewEmails.length,
        durationDays: review!.durationDays,
      }),
    enabled: review !== null,
  });

  const pay = useMutation({
    mutationFn: async (values: PurchaseForm) => {
      let purchaseId = createdId;
      if (!purchaseId) {
        const detail = await organizationsApi.createPurchase(orgId!, {
          courseId: values.courseId,
          durationDays: values.durationDays,
          emails: uniqueEmails(values.emails),
        });
        purchaseId = detail.purchase.id;
        setCreatedId(purchaseId);
        await queryClient.invalidateQueries({ queryKey: ["organization", orgId, "purchases"] });
      }
      return organizationsApi.checkout(orgId!, purchaseId);
    },
    onSuccess: ({ checkoutUrl }) => window.location.assign(checkoutUrl),
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

  if (review) {
    const reviewCourse = catalog.courses.find((c) => c.id === review.courseId);
    const payError = createdId
      ? "Guardamos la compra, pero no pudimos abrir Mercado Pago. Probá de nuevo o pagala desde el detalle de la compra."
      : pay.error instanceof ApiError && pay.error.status === 409
        ? "Alguno de esos emails ya tiene un cupo pendiente o vigente para este curso."
        : pay.error
          ? "No pudimos crear la compra. Probá de nuevo."
          : null;
    if (reviewQuote.isPending) return <LoadingState />;
    if (reviewQuote.error || !reviewCourse) {
      return <ErrorState>No pudimos cargar los datos.</ErrorState>;
    }
    return (
      <div className="flex flex-col gap-3">
        <PurchaseInvoice
          course={reviewCourse}
          quote={reviewQuote.data}
          emails={reviewEmails}
          invitationDays={catalog.invitationDays}
          confirming={pay.isPending}
          error={pay.error ? payError : null}
          onConfirm={() => pay.mutate(review)}
          onBack={
            createdId
              ? undefined
              : () => {
                  pay.reset();
                  setReview(null);
                }
          }
        />
        {createdId && pay.error ? (
          <Link
            href={`/dashboard/purchases/${createdId}`}
            className="text-primary-dark self-end text-sm font-bold hover:underline"
          >
            Ir al detalle de la compra
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => setReview(values))}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3.5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <SectionIcon name="book" className="bg-primary-light text-primary-dark" />
            <CardTitle>Curso</CardTitle>
          </div>
          <div className="grid flex-1 auto-rows-fr gap-2" role="radiogroup" aria-label="Curso">
            {catalog.courses.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "border-border hover:bg-fill/60 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition-colors",
                  courseId === option.id && "hover:bg-primary-light/40",
                  courseId === option.id && "border-primary bg-primary-light/40",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={option.id}
                    className="accent-primary size-4"
                    {...form.register("courseId")}
                  />
                  <span className="flex flex-col">
                    <span className="font-bold">{option.name}</span>
                    <span className="text-text-muted text-[13px]">
                      {option.signCount} señas · {option.modules.length}{" "}
                      {option.modules.length === 1 ? "módulo" : "módulos"}
                      {option.signCount > 0
                        ? ` · ≈ ${daysLabel(daysToComplete(option.signCount))} a ${DAILY_STUDY_MINUTES} min por día`
                        : null}
                    </span>
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
        <div className="flex flex-col gap-4">
          {course ? <CourseHero course={course} className="flex-1" /> : null}
          <Card className="flex flex-col gap-3 sm:p-6">
            <div className="flex items-center gap-2.5">
              <SectionIcon name="tag" className="bg-success-light text-success-dark" />
              <CardTitle>Precio</CardTitle>
            </div>
            {quote.data ? (
              <dl className="flex flex-col text-sm">
                <div className="border-fill flex justify-between border-b py-2">
                  <dt className="text-text-muted">Precio por cupo</dt>
                  <dd className="font-extrabold">
                    {quote.data.discountPercent > 0 ? (
                      <span className="text-text-muted mr-2 font-semibold line-through">
                        {formatMoney(quote.data.listPricePerSeat, quote.data.currency)}
                      </span>
                    ) : null}
                    {formatMoney(quote.data.pricePerSeat, quote.data.currency)}
                  </dd>
                </div>
                <div className="border-fill flex justify-between border-b py-2">
                  <dt className="text-text-muted">Cupos</dt>
                  <dd className="font-extrabold">{seats}</dd>
                </div>
                {quote.data.discountPercent > 0 ? (
                  <div className="border-fill text-success-dark flex justify-between border-b py-2">
                    <dt>Descuento por volumen</dt>
                    <dd className="font-extrabold">{quote.data.discountPercent}%</dd>
                  </div>
                ) : null}
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
            {nextDiscount ? (
              <p className="bg-success-light text-success-dark rounded-xl px-3 py-2 text-[13px] font-semibold">
                Sumá {nextDiscount.missing} {nextDiscount.missing === 1 ? "cupo" : "cupos"} más y
                tenés {nextDiscount.percent}% de descuento en cada cupo.
              </p>
            ) : null}
            <p className="text-text-muted text-[13px] text-pretty">
              El precio depende de las señas del curso, los días de acceso y la cantidad de cupos.
              Antes de pagar vas a ver el resumen de la compra.
            </p>
            <button type="submit" disabled={seats === 0} className={primaryButton}>
              Revisar la compra
            </button>
            {seats === 0 ? (
              <p className="text-text-muted text-center text-[13px]">
                Cargá los emails de las personas más abajo para revisar la compra.
              </p>
            ) : null}
          </Card>
        </div>
      </div>

      {course ? <CourseShowcase course={course} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3.5 sm:p-6">
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
          {course ? (
            <div className="mt-auto">
              <CompletionEstimate
                signCount={course.signCount}
                durationDays={validDuration ? durationDays : null}
                maxDays={catalog.maxDays}
                onPick={(days) => form.setValue("durationDays", days, { shouldValidate: true })}
              />
            </div>
          ) : null}
        </Card>
        <Card className="flex flex-col gap-3.5 sm:p-6">
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
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
            Un email por cupo
            <textarea
              rows={5}
              placeholder={"nombre@empresa.com\notra@empresa.com"}
              aria-invalid={Boolean(form.formState.errors.emails)}
              className="border-border bg-surface min-h-36 flex-1 resize-none rounded-lg border px-3 py-2 text-[15px]"
              {...form.register("emails")}
            />
            <span className="text-text-muted text-[13px] font-normal">
              Formato: usuario@dominio.com — separalos con comas o saltos de línea. La invitación
              solo la puede aceptar la cuenta de ese email.
            </span>
            <span className="text-text-muted text-[13px] font-normal">
              Excel o CSV: tomamos todas las celdas que tengan un email, en cualquier fila o
              columna. No hace falta encabezado.
            </span>
          </label>
          {sheetMessage ? <p className="text-text-muted text-[13px]">{sheetMessage}</p> : null}
          {form.formState.errors.emails ? (
            <span role="alert" className="text-danger text-sm">
              {form.formState.errors.emails.message}
            </span>
          ) : null}
        </Card>
      </div>

      {course ? <CourseContents course={course} /> : null}
    </form>
  );
}

function daysLabel(days: number): string {
  return `${days} ${days === 1 ? "día" : "días"}`;
}

/** How long one person takes to finish the course at the reference daily pace. */
function CompletionEstimate({
  signCount,
  durationDays,
  maxDays,
  onPick,
}: {
  signCount: number;
  durationDays: number | null;
  maxDays: number;
  onPick: (days: number) => void;
}) {
  const needed = daysToComplete(signCount);
  if (needed === 0) return null;
  const short = durationDays !== null && durationDays < needed;
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-xl px-3.5 py-3 text-[13px] text-pretty",
        short ? "bg-shop-amber-light text-shop-amber-dark" : "bg-primary-light/60 text-text",
      )}
    >
      <p>
        <span className="font-bold">
          Dedicándole {DAILY_STUDY_MINUTES} minutos por día, una persona termina el curso en unos{" "}
          {needed} {needed === 1 ? "día" : "días"}.
        </span>{" "}
        Calculamos un promedio por seña entre aprenderla y practicarla.
      </p>
      {short && durationDays !== null ? (
        <p>
          Con {durationDays} días, a ese ritmo llega a ver unas{" "}
          {signsWithin(durationDays, signCount)} de las {signCount} señas.{" "}
          {needed <= maxDays ? (
            <button
              type="button"
              onClick={() => onPick(needed)}
              className="font-bold underline underline-offset-2"
            >
              Elegir {needed} días
            </button>
          ) : (
            `Para terminarlo en ${maxDays} días hace falta dedicarle un poco más por día.`
          )}
        </p>
      ) : null}
    </div>
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
