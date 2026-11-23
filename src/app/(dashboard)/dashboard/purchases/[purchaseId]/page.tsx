"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Icon } from "@/components/dashboard/icons";
import {
  PurchaseStatusPill,
  RefundRequestPill,
  SeatStatusPill,
} from "@/components/dashboard/purchase-status";
import { CourseDetailsDialog } from "@/components/dashboard/course-details-dialog";
import { SeatEmailEditor } from "@/components/dashboard/seat-email-editor";
import { WithdrawPurchase } from "@/components/dashboard/withdraw-purchase";
import {
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  PageHeading,
  StatCard,
  pillButton,
  primaryButton,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { invitationsKey } from "@/features/dashboard/use-invited-seats";
import { ApiError } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import type { PurchaseDetail, PurchaseStatus, Seat } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import {
  REFUNDED_MESSAGE,
  PAYMENT_METHOD_LABEL,
  SEAT_GROUPS,
  canWithdraw,
  seatsInGroup,
  REFUND_RULE,
  formatMoney,
  paymentMessage,
  paymentReturn,
  seatEmailLabel,
  type SeatGroup,
  type WithdrawalForm,
} from "@/lib/purchases";
import { REFUND_REASON_OPTIONS, REFUND_REASON_VALUES } from "@/lib/refund-reasons";
import { cn } from "@/lib/utils";

const PAYMENT_TONE = {
  success: "bg-success-light text-success-dark",
  warning: "bg-shop-amber-light text-shop-amber-dark",
  danger: "bg-danger-light text-danger",
} as const;

function seatDates(seat: Seat, purchaseStatus: PurchaseStatus): string {
  if (seat.activatedAt && seat.accessExpiresAt) {
    const verb = seat.status === "ACTIVE" ? "vence" : "venció";
    return `Activó el ${formatDate(seat.activatedAt)} · ${verb} el ${formatDate(seat.accessExpiresAt)}`;
  }
  if (seat.revokedAt) {
    const label = purchaseStatus === "REFUNDED" ? "Acceso anulado" : "Quitado";
    return `${label} el ${formatDate(seat.revokedAt)}`;
  }
  const reminded = seat.lastReminderAt ?? seat.autoReminderSentAt;
  if (seat.invitedAt) {
    return reminded
      ? `Invitado el ${formatDate(seat.invitedAt)} · último recordatorio el ${formatDate(reminded)}`
      : `Invitado el ${formatDate(seat.invitedAt)}`;
  }
  return "";
}

/** A reason from the shared list is required; the comment is optional. */
const refundSchema = z.object({
  reason: z.enum(REFUND_REASON_VALUES, { error: "Elegí un motivo." }),
  message: z
    .string()
    .trim()
    .max(2000, "El mensaje no puede superar los 2000 caracteres")
    .transform((v) => v || undefined),
});
type RefundFormInput = z.input<typeof refundSchema>;
type RefundFormValues = z.output<typeof refundSchema>;

function RefundRequestSection({ orgId, purchaseId }: { orgId: string; purchaseId: string }) {
  const [sent, setSent] = useState(false);
  const form = useForm<RefundFormInput, unknown, RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: { reason: undefined, message: "" },
  });
  const mutation = useMutation({
    mutationFn: (values: RefundFormValues) =>
      organizationsApi.createPurchaseRefundRequest(orgId, purchaseId, values),
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle>Reembolso solicitado</CardTitle>
        <p className="text-text-muted text-sm text-pretty">
          Recibimos tu pedido. Nuestro equipo lo analizará y te va a responder por email.
        </p>
      </Card>
    );
  }

  const refundError =
    mutation.error instanceof ApiError && mutation.error.status === 400
      ? "No se puede pedir el reembolso: puede que haya un pedido pendiente o que las condiciones hayan cambiado."
      : mutation.error
        ? "No pudimos enviar el pedido. Probá de nuevo."
        : null;

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Pedir reembolso</CardTitle>
      <p className="text-text-muted text-sm text-pretty">
        {REFUND_RULE} Nuestro equipo analizará el pedido y te responderá por email. No se devuelve
        dinero automáticamente.
      </p>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="refund-reason" className="text-sm font-semibold">
            Motivo
          </label>
          <select
            id="refund-reason"
            defaultValue=""
            aria-invalid={Boolean(form.formState.errors.reason)}
            className="border-border bg-surface rounded-lg border px-3 py-2 text-sm"
            {...form.register("reason")}
          >
            <option value="" disabled>
              Elegí un motivo
            </option>
            {REFUND_REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {form.formState.errors.reason ? (
            <span role="alert" className="text-danger text-xs">
              {form.formState.errors.reason.message}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="refund-message" className="text-sm font-semibold">
            Comentario <span className="text-text-muted font-normal">(opcional)</span>
          </label>
          <textarea
            id="refund-message"
            rows={4}
            maxLength={2000}
            placeholder="Contanos qué pasó para que podamos ayudarte mejor."
            className="border-border bg-surface rounded-lg border px-3 py-2 text-sm"
            {...form.register("message")}
          />
          {form.formState.errors.message ? (
            <span className="text-danger text-xs">{form.formState.errors.message.message}</span>
          ) : null}
        </div>
        {refundError ? <p className="text-danger text-sm">{refundError}</p> : null}
        <div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className={cn(primaryButton, "px-4 py-2 text-sm")}
          >
            {mutation.isPending ? "Enviando…" : "Enviar pedido"}
          </button>
        </div>
      </form>
    </Card>
  );
}

export default function PurchaseDetailPage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read once: the URL is cleaned right after so a reload does not sync again.
  const [returned] = useState(() => paymentReturn(new URLSearchParams(searchParams.toString())));
  const handledReturn = useRef(false);
  const { organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const key = ["organization", orgId, "purchases", purchaseId];
  const [editing, setEditing] = useState<string | null>(null);
  const [group, setGroup] = useState<SeatGroup>("ALL");
  const [showCourse, setShowCourse] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  const { data, isPending, error } = useQuery({
    queryKey: key,
    queryFn: () => organizationsApi.purchase(orgId!, purchaseId),
    enabled: Boolean(orgId),
    // Back from Mercado Pago with the payment still processing: the webhook may confirm it soon.
    refetchInterval: (query) =>
      returned &&
      returned.result !== "rechazado" &&
      query.state.data?.purchase.status === "PENDING_PAYMENT"
        ? 5000
        : // While a refund is still possible, an invitee may accept at any moment and close it.
          query.state.data?.purchase.status === "PAID" &&
            !query.state.data.purchase.hasAcceptedSeats
          ? 15000
          : false,
  });

  // How the people of this purchase are doing; only once someone could have accepted.
  const progress = useQuery({
    queryKey: [...key, "progress"],
    queryFn: () => organizationsApi.purchaseProgress(orgId!, purchaseId),
    enabled: Boolean(orgId) && Boolean(data?.purchase.paidAt),
  });

  const store = async (detail: PurchaseDetail) => {
    queryClient.setQueryData(key, detail);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["organization", orgId, "purchases"] }),
      queryClient.invalidateQueries({ queryKey: invitationsKey(orgId) }),
    ]);
  };

  const updateEmail = useMutation({
    mutationFn: ({ seatId, email }: { seatId: string; email: string }) =>
      organizationsApi.updateSeatEmail(orgId!, purchaseId, seatId, email),
    onSuccess: async (detail) => {
      await store(detail);
      setEditing(null);
      setNotice("Guardamos el nuevo email.");
    },
  });

  const remind = useMutation({
    mutationFn: (seatId: string) => organizationsApi.remindSeat(orgId!, purchaseId, seatId),
    onSuccess: async (detail) => {
      await store(detail);
      setNotice("Mandamos el recordatorio.");
    },
  });

  const sync = useMutation({
    mutationFn: () => organizationsApi.syncPayment(orgId!, purchaseId),
    onSuccess: async (result) => {
      await store(result.purchase);
    },
  });

  const checkout = useMutation({
    mutationFn: () => organizationsApi.checkout(orgId!, purchaseId),
    onSuccess: ({ checkoutUrl }) => window.location.assign(checkoutUrl),
  });

  useEffect(() => {
    if (!orgId || !returned || handledReturn.current) return;
    handledReturn.current = true;
    router.replace(`/dashboard/purchases/${purchaseId}`, { scroll: false });
    sync.mutate();
  }, [orgId, returned, router, purchaseId, sync]);

  const cancel = useMutation({
    mutationFn: () => organizationsApi.cancelPurchase(orgId!, purchaseId),
    onSuccess: store,
  });

  const withdraw = useMutation({
    mutationFn: (values: WithdrawalForm) =>
      organizationsApi.withdrawPurchase(orgId!, purchaseId, values),
    onSuccess: store,
  });

  const back = (
    <Link
      href="/dashboard/purchases"
      className="text-text-muted inline-flex items-center gap-1 text-sm font-bold hover:underline"
    >
      <Icon name="chevronBack" className="size-4" />
      Compras
    </Link>
  );

  if (isPending) return <LoadingState />;
  if (error) return <ErrorState>No pudimos cargar los datos.</ErrorState>;

  const copyMpOrderId = (value: string) => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const { purchase, seats, refunds } = data;
  const payment =
    !returned || purchase.status === "PENDING_PAYMENT"
      ? null
      : purchase.status === "PAID"
        ? paymentMessage("approved")
        : (purchase.status === "CANCELLED" || purchase.status === "REFUNDED") &&
            data.refunds.length > 0
          ? REFUNDED_MESSAGE
          : null;
  const unpaid = purchase.paidAt === null;
  const visible = seatsInGroup(seats, group);
  const seatProgress = new Map(
    (progress.data?.seats ?? []).map((s) => [s.seatId, s.progressPercentage]),
  );
  const withdrawError =
    withdraw.error instanceof ApiError && withdraw.error.status === 400
      ? "Ya no se puede anular esta compra: el plazo terminó o cambió su estado. Recargá la página."
      : withdraw.error instanceof ApiError && withdraw.error.status === 503
        ? "Mercado Pago no respondió y no pudimos devolver el dinero. Probá de nuevo en unos minutos: no se va a devolver dos veces."
        : withdraw.error
          ? "No pudimos anular la compra. Probá de nuevo."
          : null;
  const updateError =
    updateEmail.error instanceof ApiError && updateEmail.error.status === 409
      ? "Ese email ya tiene un cupo de este curso."
      : updateEmail.error
        ? "No pudimos cambiar el email."
        : null;

  return (
    <section className="flex flex-col gap-5">
      {back}
      <PageHeading
        title={purchase.courseName}
        subtitle={`Compra del ${formatDate(purchase.createdAt)}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {purchase.hasRefundRequest ? (
            <RefundRequestPill />
          ) : (
            <PurchaseStatusPill status={purchase.status} />
          )}
          <button type="button" onClick={() => setShowCourse(true)} className={pillButton}>
            <Icon name="book" className="size-4" />
            Ver detalles del curso
          </button>
        </div>
      </PageHeading>

      {payment ? (
        <p
          role="status"
          className={cn("rounded-2xl px-5 py-4 text-sm font-semibold", PAYMENT_TONE[payment.tone])}
        >
          {payment.text}
        </p>
      ) : null}

      {purchase.status === "PENDING_PAYMENT" ? (
        <div className="bg-shop-amber-light text-shop-amber-dark flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-semibold">
          <span className="min-w-0 flex-1 basis-64">
            La compra está pendiente de pago. Cuando Mercado Pago lo confirme, mandamos las
            invitaciones y empieza el plazo de 10 días para aceptarlas.
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={checkout.isPending || cancel.isPending}
              onClick={() => checkout.mutate()}
              className={cn(primaryButton, "px-4 py-2 text-sm")}
            >
              {checkout.isPending
                ? "Yendo a Mercado Pago…"
                : `Pagar ${formatMoney(purchase.totalAmount, purchase.currency)} con Mercado Pago`}
            </button>
            <button
              type="button"
              disabled={cancel.isPending || checkout.isPending}
              onClick={() => cancel.mutate()}
              className={cn(pillButton, "text-danger")}
            >
              {cancel.isPending ? "Cancelando…" : "Cancelar compra"}
            </button>
          </div>
        </div>
      ) : null}
      {purchase.status === "REFUNDED" ? (
        <p
          role="status"
          className="bg-danger-light text-danger rounded-2xl px-5 py-4 text-sm font-semibold"
        >
          {purchase.refundedAt
            ? `Compra anulada y reembolsada el ${formatDate(purchase.refundedAt)}.`
            : "Compra anulada y reembolsada."}{" "}
          Se anularon las invitaciones pendientes y las personas que habían activado el curso
          perdieron el acceso; su progreso se conserva.
        </p>
      ) : null}
      {withdraw.isSuccess && purchase.status === "REFUNDED" ? (
        <p role="status" className="text-success-dark text-sm font-semibold">
          Listo: anulamos la compra y Mercado Pago está devolviendo el dinero. Les avisamos por
          email a las personas afectadas.
        </p>
      ) : null}

      {checkout.error ? (
        <ErrorState>No pudimos abrir Mercado Pago. Probá de nuevo en unos minutos.</ErrorState>
      ) : null}
      {cancel.error ? <ErrorState>No pudimos cancelar la compra.</ErrorState> : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {unpaid ? null : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
              <StatCard
                label="Completaron"
                value={progress.data ? progress.data.completed : "—"}
                hint={
                  progress.data
                    ? `de ${progress.data.participants} ${progress.data.participants === 1 ? "persona" : "personas"} en el curso`
                    : progress.isPending
                      ? "Cargando…"
                      : "No pudimos cargar el avance"
                }
              />
              <StatCard
                label="Progreso promedio"
                value={
                  progress.data && progress.data.started > 0
                    ? `${progress.data.averageProgress}%`
                    : "—"
                }
                hint={
                  progress.data
                    ? `De ${progress.data.started} ${progress.data.started === 1 ? "persona que empezó" : "personas que empezaron"}`
                    : "De quienes empezaron"
                }
              />
              <StatCard
                label="Tasa de finalización"
                value={
                  progress.data && progress.data.participants > 0
                    ? `${progress.data.completionPercentage}%`
                    : "—"
                }
              />
            </div>
          )}

          <Card className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Personas</CardTitle>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="Filtrar por invitación"
              >
                {SEAT_GROUPS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={group === option.value}
                    onClick={() => setGroup(option.value)}
                    className={cn(
                      pillButton,
                      group === option.value && "border-primary bg-primary-light text-primary-dark",
                    )}
                  >
                    {option.label} · {seatsInGroup(seats, option.value).length}
                  </button>
                ))}
              </div>
            </div>
            {notice ? (
              <p role="status" className="text-success-dark text-sm font-semibold">
                {notice}
              </p>
            ) : null}
            {remind.error ? (
              <ErrorState>
                {remind.error instanceof ApiError && remind.error.status === 400
                  ? "Ya mandamos un recordatorio hace poco. Probá más tarde."
                  : "No pudimos mandar el recordatorio."}
              </ErrorState>
            ) : null}
            {visible.length === 0 ? (
              <p className="text-text-muted border-fill-dark rounded-2xl border border-dashed p-4 text-center text-sm">
                {group === "ACCEPTED"
                  ? "Nadie aceptó la invitación todavía."
                  : group === "NOT_ACCEPTED"
                    ? "No hay invitaciones sin aceptar."
                    : "Esta compra no tiene personas."}
              </p>
            ) : (
              <ul className="flex flex-col">
                {visible.map((seat) => {
                  const canRemind =
                    seat.status === "INVITED" &&
                    (!seat.nextReminderAvailableAt ||
                      new Date(seat.nextReminderAvailableAt).getTime() <= now);
                  const seatAdvance = seatProgress.get(seat.id);
                  return (
                    <li
                      key={seat.id}
                      className="border-fill flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-b-0"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        {editing === seat.id ? (
                          <SeatEmailEditor
                            seat={seat}
                            saving={updateEmail.isPending}
                            error={updateError}
                            onCancel={() => {
                              setEditing(null);
                              updateEmail.reset();
                            }}
                            onSave={(email) => updateEmail.mutate({ seatId: seat.id, email })}
                          />
                        ) : (
                          <>
                            <span className="truncate font-semibold">
                              {seat.userName ? `${seat.userName} · ` : null}
                              {seatEmailLabel(seat.email)}
                            </span>
                            <span className="text-text-muted text-[13px]">
                              {seatDates(seat, purchase.status)}
                              {seatAdvance !== undefined ? ` · Avance ${seatAdvance}%` : ""}
                            </span>
                          </>
                        )}
                      </div>
                      {editing === seat.id ? null : (
                        <div className="flex flex-wrap items-center gap-2">
                          <SeatStatusPill status={seat.status} purchaseStatus={purchase.status} />
                          {seat.canEditEmail ? (
                            <button
                              type="button"
                              onClick={() => {
                                setNotice(null);
                                updateEmail.reset();
                                setEditing(seat.id);
                              }}
                              className={pillButton}
                            >
                              Cambiar email
                            </button>
                          ) : null}
                          {seat.status === "INVITED" ? (
                            <button
                              type="button"
                              disabled={!canRemind || remind.isPending}
                              title={
                                canRemind
                                  ? undefined
                                  : `Podés mandar otro recordatorio el ${formatDate(seat.nextReminderAvailableAt!)}`
                              }
                              onClick={() => {
                                setNotice(null);
                                remind.mutate(seat.id);
                              }}
                              className={pillButton}
                            >
                              <Icon name="mail" className="size-4" />
                              Recordar
                            </button>
                          ) : null}
                          {seat.userId && purchase.status !== "REFUNDED" ? (
                            <Link href={`/dashboard/members/${seat.userId}`} className={pillButton}>
                              Ver avance
                            </Link>
                          ) : null}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Card className="flex flex-col gap-1">
            <CardTitle>Resumen de la compra</CardTitle>
            <p className="font-display mt-1 text-3xl font-extrabold tracking-tight">
              {formatMoney(purchase.totalAmount, purchase.currency)}
            </p>
            <dl className="flex flex-col text-sm">
              {(
                [
                  ...(purchase.discountPercent > 0
                    ? [
                        [
                          "Precio de lista",
                          formatMoney(purchase.listPricePerSeat, purchase.currency),
                        ],
                      ]
                    : []),
                  [
                    "Precio por cupo",
                    purchase.discountPercent > 0
                      ? `${formatMoney(purchase.pricePerSeat, purchase.currency)} (${purchase.discountPercent}% off)`
                      : formatMoney(purchase.pricePerSeat, purchase.currency),
                  ],
                  ["Cupos", String(purchase.seats)],
                  ["Señas del curso", String(purchase.signCount)],
                  ["Fecha de compra", formatDate(purchase.createdAt)],
                  ["Fecha de pago", purchase.paidAt ? formatDate(purchase.paidAt) : "Pendiente"],
                  [
                    "Método de pago",
                    purchase.paymentMethod ? PAYMENT_METHOD_LABEL[purchase.paymentMethod] : "—",
                  ],
                  ["Referencia de compra", purchase.externalRef],
                  ...(purchase.mpOrderId
                    ? [
                        [
                          "Orden de Mercado Pago",
                          <span key="mp" className="flex min-w-0 items-center justify-end gap-1.5">
                            <span
                              className="max-w-[140px] cursor-text truncate font-extrabold select-all"
                              title={purchase.mpOrderId}
                            >
                              {purchase.mpOrderId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyMpOrderId(purchase.mpOrderId!)}
                              title="Copiar número de orden"
                              className="text-text-muted hover:text-text shrink-0 transition-colors"
                            >
                              <Icon name={copied ? "check" : "copy"} className="size-4" />
                            </button>
                          </span>,
                        ] as [string, React.ReactNode],
                      ]
                    : []),
                  [
                    "Plazo para aceptar",
                    purchase.invitationDeadline
                      ? `Hasta el ${formatDate(purchase.invitationDeadline)}`
                      : "Empieza con el pago",
                  ],
                  [
                    "Duración del acceso",
                    `${purchase.durationDays} días desde que cada persona acepta`,
                  ],
                  ...(purchase.status === "REFUNDED"
                    ? [
                        [
                          "Anulación",
                          purchase.refundedAt
                            ? `Reembolsada el ${formatDate(purchase.refundedAt)}`
                            : "Reembolsada",
                        ],
                        ...(refunds.length > 0
                          ? [
                              [
                                "Monto reembolsado",
                                formatMoney(
                                  refunds.reduce((sum, r) => sum + r.amount, 0),
                                  purchase.currency,
                                ),
                              ],
                            ]
                          : []),
                      ]
                    : purchase.status === "CANCELLED"
                      ? [
                          [
                            "Cancelada el",
                            purchase.cancelledAt ? formatDate(purchase.cancelledAt) : "—",
                          ],
                        ]
                      : purchase.status === "PAID"
                        ? [
                            [
                              "Anulación con reembolso",
                              // Asked for (a purchase SIGNA confirmed by hand stays paid until
                              // SIGNA gives the money back): say so, not "Ya no disponible".
                              purchase.hasRefundRequest
                                ? "Pedida, en revisión"
                                : purchase.refundableUntil && canWithdraw(purchase, new Date(now))
                                  ? `Hasta el ${formatDate(purchase.refundableUntil)}`
                                  : "Ya no disponible",
                            ],
                          ]
                        : []),
                ] as [string, React.ReactNode][]
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="border-fill flex justify-between gap-3 border-b py-2.5 last:border-b-0"
                >
                  <dt className="text-text-muted">{label}</dt>
                  <dd className="min-w-0 text-right font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {canWithdraw(purchase, new Date(now)) ? (
            <WithdrawPurchase
              purchase={purchase}
              pending={withdraw.isPending}
              error={withdrawError}
              onConfirm={(values) => withdraw.mutate(values)}
            />
          ) : purchase.hasRefundRequest ? (
            <Card className="flex flex-col gap-2">
              <CardTitle>Reembolso en revisión</CardTitle>
              <p className="text-text-muted text-sm text-pretty">
                Recibimos tu pedido de reembolso. Nuestro equipo lo analizará y te va a responder
                por email.
              </p>
            </Card>
          ) : purchase.status === "PAID" && !purchase.hasAcceptedSeats && orgId ? (
            <RefundRequestSection orgId={orgId} purchaseId={purchaseId} />
          ) : purchase.status === "PAID" && purchase.hasAcceptedSeats ? (
            <Card className="flex flex-col gap-2">
              <CardTitle>Reembolso no disponible</CardTitle>
              <p className="text-text-muted text-sm text-pretty">
                Al menos una persona invitada ya aceptó su invitación, por eso esta compra ya no se
                puede reembolsar. {REFUND_RULE}
              </p>
            </Card>
          ) : null}
        </div>
      </div>

      {showCourse && orgId ? (
        <CourseDetailsDialog
          orgId={orgId}
          purchaseId={purchaseId}
          onClose={() => setShowCourse(false)}
        />
      ) : null}
    </section>
  );
}
