"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Icon } from "@/components/dashboard/icons";
import { PurchaseStatusPill, SeatStatusPill } from "@/components/dashboard/purchase-status";
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
import { ApiError } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import type { PurchaseDetail, Seat, SeatStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import {
  REFUNDED_MESSAGE,
  REFUND_REASON_LABEL,
  SEAT_STATUS_LABEL,
  daysLeft,
  formatMoney,
  paymentMessage,
  paymentReturn,
  seatEmailSchema,
} from "@/lib/purchases";
import { cn } from "@/lib/utils";

const PAYMENT_TONE = {
  success: "bg-success-light text-success-dark",
  warning: "bg-shop-amber-light text-shop-amber-dark",
  danger: "bg-danger-light text-danger",
} as const;

const FILTERS: { value: SeatStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "INVITED", label: "Sin aceptar" },
  { value: "ACTIVE", label: "Acceso activo" },
  { value: "INVITATION_EXPIRED", label: "Invitación vencida" },
  { value: "ACCESS_EXPIRED", label: "Acceso vencido" },
];

function seatDates(seat: Seat): string {
  if (seat.activatedAt && seat.accessExpiresAt) {
    const verb = seat.status === "ACTIVE" ? "vence" : "venció";
    return `Activó el ${formatDate(seat.activatedAt)} · ${verb} el ${formatDate(seat.accessExpiresAt)}`;
  }
  if (seat.revokedAt) return `Quitado el ${formatDate(seat.revokedAt)}`;
  const reminded = seat.lastReminderAt ?? seat.autoReminderSentAt;
  if (seat.invitedAt) {
    return reminded
      ? `Invitado el ${formatDate(seat.invitedAt)} · último recordatorio el ${formatDate(reminded)}`
      : `Invitado el ${formatDate(seat.invitedAt)}`;
  }
  return "";
}

function EmailEditor({
  seat,
  onSave,
  onCancel,
  saving,
  error,
}: {
  seat: Seat;
  onSave: (email: string) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const form = useForm<{ email: string }>({
    resolver: zodResolver(seatEmailSchema),
    defaultValues: { email: seat.email },
  });
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => onSave(values.email.trim()))}
      className="flex flex-col gap-1.5"
    >
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          autoFocus
          aria-label="Nuevo email"
          className="border-border bg-surface min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm"
          {...form.register("email")}
        />
        <button type="submit" disabled={saving} className={pillButton}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" disabled={saving} onClick={onCancel} className={pillButton}>
          Cancelar
        </button>
      </div>
      {form.formState.errors.email ? (
        <span className="text-danger text-xs">{form.formState.errors.email.message}</span>
      ) : null}
      {error ? <span className="text-danger text-xs">{error}</span> : null}
      {seat.status === "INVITED" ? (
        <span className="text-text-muted text-xs">
          El link anterior deja de funcionar y mandamos uno nuevo. El plazo no se reinicia.
        </span>
      ) : null}
    </form>
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
  const [filter, setFilter] = useState<SeatStatus | "ALL">("ALL");
  const [notice, setNotice] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

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
        : false,
  });

  const store = async (detail: PurchaseDetail) => {
    queryClient.setQueryData(key, detail);
    await queryClient.invalidateQueries({ queryKey: ["organization", orgId, "purchases"] });
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
    mutationFn: (paymentId: string) => organizationsApi.syncPayment(orgId!, purchaseId, paymentId),
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
    if (returned.paymentId) sync.mutate(returned.paymentId);
  }, [orgId, returned, router, purchaseId, sync]);

  const cancel = useMutation({
    mutationFn: () => organizationsApi.cancelPurchase(orgId!, purchaseId),
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

  const { purchase, seats } = data;
  const payment = !returned
    ? null
    : sync.isPending
      ? { tone: "warning" as const, text: "Estamos confirmando el pago con Mercado Pago…" }
      : purchase.status === "PAID"
        ? paymentMessage("approved")
        : purchase.status === "CANCELLED" && data.refunds.length > 0
          ? REFUNDED_MESSAGE
          : sync.data
            ? paymentMessage(sync.data.paymentStatus)
            : paymentMessage(returned.result === "rechazado" ? "rejected" : "pending");
  const counts = purchase.seatCounts;
  const left = daysLeft(purchase.invitationDeadline, new Date(now));
  const visible = filter === "ALL" ? seats : seats.filter((seat) => seat.status === filter);
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
        subtitle={`Compra del ${formatDate(purchase.createdAt)} · ${purchase.seats} ${purchase.seats === 1 ? "cupo" : "cupos"} de ${purchase.durationDays} días`}
      >
        <PurchaseStatusPill status={purchase.status} />
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
      {checkout.error ? (
        <ErrorState>No pudimos abrir Mercado Pago. Probá de nuevo en unos minutos.</ErrorState>
      ) : null}
      {cancel.error ? <ErrorState>No pudimos cancelar la compra.</ErrorState> : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <StatCard
          label="Total"
          value={formatMoney(purchase.totalAmount, purchase.currency)}
          hint={
            purchase.discountPercent > 0
              ? `${formatMoney(purchase.pricePerSeat, purchase.currency)} por cupo · ${purchase.discountPercent}% de descuento`
              : `${formatMoney(purchase.pricePerSeat, purchase.currency)} por cupo`
          }
        />
        <StatCard
          label="Aceptaron"
          value={`${counts.active + counts.accessExpired}/${purchase.seats}`}
          hint={`${counts.active} con acceso activo`}
        />
        <StatCard
          label="Sin aceptar"
          value={counts.invited}
          hint={
            purchase.status === "PAID" && left !== null
              ? left === 0
                ? "El plazo ya cerró"
                : `Quedan ${left} ${left === 1 ? "día" : "días"}`
              : "Todavía no se enviaron"
          }
        />
        <StatCard
          label="Cupos perdidos"
          value={counts.invitationExpired}
          hint="Invitaciones vencidas sin aceptar"
        />
      </div>

      {data.refunds.length > 0 ? (
        <Card className="flex flex-col gap-1">
          <CardTitle>Pagos devueltos</CardTitle>
          <p className="text-text-muted text-sm text-pretty">
            Estos pagos no se pudieron usar para la compra, así que los devolvimos completos al
            medio de pago en Mercado Pago. El dinero puede tardar unos días en verse según el medio.
          </p>
          <ul className="flex flex-col text-sm">
            {data.refunds.map((refund) => (
              <li
                key={refund.createdAt}
                className="border-fill flex flex-wrap items-center justify-between gap-2 border-b py-2.5 last:border-b-0"
              >
                <span className="flex flex-col">
                  <span className="font-extrabold">
                    {formatMoney(refund.amount, refund.currency)}
                  </span>
                  <span className="text-text-muted text-[13px]">
                    {REFUND_REASON_LABEL[refund.reason]}
                  </span>
                </span>
                <span className="text-text-muted text-[13px] font-semibold">
                  {refund.status === "REFUNDED" && refund.refundedAt
                    ? `Devuelto el ${formatDate(refund.refundedAt)}`
                    : "Devolución en proceso"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="flex flex-col gap-1">
        <CardTitle>Datos de la compra</CardTitle>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-6 text-sm">
          {[
            ["Fecha de pago", purchase.paidAt ? formatDate(purchase.paidAt) : "Pendiente"],
            [
              "Plazo para aceptar",
              purchase.invitationDeadline
                ? `Hasta el ${formatDate(purchase.invitationDeadline)}`
                : "Empieza con el pago",
            ],
            ["Duración del acceso", `${purchase.durationDays} días desde que cada persona acepta`],
            ["Señas del curso", String(purchase.signCount)],
          ].map(([label, value]) => (
            <div key={label} className="border-fill flex justify-between gap-3 border-b py-2.5">
              <dt className="text-text-muted">{label}</dt>
              <dd className="text-right font-extrabold">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Personas</CardTitle>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  pillButton,
                  filter === option.value && "border-primary bg-primary-light text-primary-dark",
                )}
              >
                {option.label}
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
            No hay personas con el estado «{filter === "ALL" ? "Todos" : SEAT_STATUS_LABEL[filter]}
            ».
          </p>
        ) : (
          <ul className="flex flex-col">
            {visible.map((seat) => {
              const canRemind =
                seat.status === "INVITED" &&
                (!seat.nextReminderAvailableAt ||
                  new Date(seat.nextReminderAvailableAt).getTime() <= now);
              return (
                <li
                  key={seat.id}
                  className="border-fill flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {editing === seat.id ? (
                      <EmailEditor
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
                          {seat.email}
                        </span>
                        <span className="text-text-muted text-[13px]">{seatDates(seat)}</span>
                      </>
                    )}
                  </div>
                  {editing === seat.id ? null : (
                    <div className="flex flex-wrap items-center gap-2">
                      <SeatStatusPill status={seat.status} />
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
                      {seat.userId ? (
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
    </section>
  );
}
