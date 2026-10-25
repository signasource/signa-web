"use client";

import * as XLSX from "xlsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CourseSigns } from "@/components/dashboard/course-signs";
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
  emailsFromSheet,
  formatMoney,
  nextVolumeDiscount,
  purchaseFormSchema,
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
      className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4"
    >
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <SectionIcon name="book" className="bg-primary-light text-primary-dark" />
            <CardTitle>Curso</CardTitle>
          </div>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Curso">
            {catalog.courses.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "border-border flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4",
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

        {course ? (
          <Card className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <CardTitle>Señas que incluye {course.name}</CardTitle>
              <p className="text-text-muted text-sm text-pretty">
                {course.description ??
                  "Revisá que estas señas les sirvan a tus equipos antes de comprar."}
              </p>
            </div>
            <CourseSigns course={course} />
          </Card>
        ) : null}

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
          <CardTitle>Precio</CardTitle>
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
