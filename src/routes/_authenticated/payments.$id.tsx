import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Archive,
  ChevronLeft,
  Copy,
  CircleCheck,
  Paperclip,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PaymentQrCode } from "@/components/PaymentQrCode";
import { PayNowButton } from "@/components/PayNowButton";
import { deletePayment, getPayment, setPaymentStatus } from "@/lib/payments.functions";
import { useI18n } from "@/lib/i18n";
import {
  STATUS_TONES,
  TONE_CLASSES,
  categoryLabel,
  dueLabel,
  effectiveStatus,
  formatAmount,
  formatDate,
  statusLabel,
} from "@/lib/payments";

export const Route = createFileRoute("/_authenticated/payments/$id")({
  head: () => ({
    meta: [
      { title: "Dettaglio pagamento — PagoPilot" },
      {
        name: "description",
        content: "Tutti i dettagli, i documenti e le azioni disponibili per questo pagamento.",
      },
      { property: "og:title", content: "Dettaglio pagamento — PagoPilot" },
      { property: "og:description", content: "Importo, scadenza, numero avviso e ricevuta." },
    ],
  }),
  component: PaymentDetailPage,
});

function PaymentDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, lang } = useI18n();
  const fetchPayment = useServerFn(getPayment);
  const changeStatus = useServerFn(setPaymentStatus);
  const removePayment = useServerFn(deletePayment);

  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => fetchPayment({ data: { id } }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["payments"] });
    void queryClient.invalidateQueries({ queryKey: ["payment", id] });
  };

  const status = useMutation({
    mutationFn: (next: "paid" | "archived" | "pending") => changeStatus({ data: { id, status: next } }),
    onSuccess: (_data, next) => {
      toast.success(
        next === "paid"
          ? t("detail.toast.paid")
          : next === "archived"
            ? t("detail.toast.archived")
            : t("detail.toast.reopened"),
      );
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => removePayment({ data: { id } }),
    onSuccess: () => {
      toast.success(t("detail.toast.deleted"));
      invalidate();
      void router.navigate({ to: "/documents", search: { filter: "all" } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">{t("detail.loading")}</p>;
  }

  if (!payment) {
    return (
      <div className="p-6 text-center">
        <p className="font-semibold">{t("detail.notFound")}</p>
        <Link to="/documents" search={{ filter: "all" }} className="mt-3 inline-block text-sm text-primary">
          {t("detail.backToDocs")}
        </Link>
      </div>
    );
  }

  const effective = effectiveStatus(payment);
  const isPaid = effective === "paid";

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="glass sticky top-0 z-20 border-b border-border/60 px-4 py-3">
        <Link to="/documents" search={{ filter: "all" }} className="inline-flex items-center gap-1 text-[15px] text-primary">
          <ChevronLeft className="size-5" aria-hidden /> {t("detail.back")}
        </Link>
      </header>

      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="ios-card mb-6 p-6 text-center">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${TONE_CLASSES[STATUS_TONES[effective]]}`}
          >
            {statusLabel(t, effective)}
          </span>
          <p className="mt-4 text-4xl font-bold tabular-nums">{formatAmount(payment.amount, lang)}</p>
          <h1 className="mt-2 text-lg font-semibold">{payment.title}</h1>
          <p className="text-sm text-muted-foreground">{payment.entity ?? t("field.noEntity")}</p>
          <p className="mt-4 text-2xl font-semibold">
            {formatDate(payment.due_date, lang) || t("due.none")}
          </p>
          <p className="text-[13px] text-muted-foreground">{dueLabel(payment.due_date, t)}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <Button
            size="lg"
            onClick={() => status.mutate(isPaid ? "pending" : "paid")}
            disabled={status.isPending}
          >
            <CircleCheck className="size-4" aria-hidden /> {isPaid ? t("detail.markUnpaid") : t("detail.markPaid")}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => toast.info(t("detail.attach.soon"))}
          >
            <Paperclip className="size-4" aria-hidden /> {t("detail.attach")}
          </Button>
        </div>

        {isPaid ? null : <PayNowButton payment={payment} />}

        <PaymentQrCode payment={payment} />

        <section className="ios-card mb-6 divide-y divide-border/70 overflow-hidden">
          <DetailRow label={t("field.category")} value={categoryLabel(t, payment.category)} />
          <DetailRow
            label={t("field.noticeNumber")}
            value={payment.notice_number}
            onCopy={payment.notice_number ?? undefined}
          />
          <DetailRow
            label={t("field.taxCode")}
            value={payment.tax_code}
            onCopy={payment.tax_code ?? undefined}
          />
          <DetailRow label={t("field.iban")} value={payment.iban} onCopy={payment.iban ?? undefined} />
          <DetailRow
            label={t("field.tags")}
            value={payment.tags.length ? payment.tags.join(", ") : null}
          />
          <DetailRow label={t("field.notes")} value={payment.notes} />
          <DetailRow
            label={t("detail.created")}
            value={formatDate(payment.created_at.slice(0, 10), lang)}
          />
        </section>

        <p className="mb-4 px-1 text-[13px] text-muted-foreground">
          {t("detail.disclaimer")}
        </p>

        <section className="ios-card divide-y divide-border/70 overflow-hidden">
          <ActionRow
            icon={Share2}
            label={t("detail.share")}
            onClick={async () => {
              const text = `${payment.title} — ${formatAmount(payment.amount, lang)} due ${formatDate(payment.due_date)}`;
              if (navigator.share) {
                try {
                  await navigator.share({ title: payment.title, text });
                  return;
                } catch {
                  /* user dismissed the share sheet */
                }
              }
              await navigator.clipboard.writeText(text);
              toast.success(t("detail.sharedCopied"));
            }}
          />
          <ActionRow
            icon={Archive}
            label={t("detail.archive")}
            onClick={() => status.mutate("archived")}
          />
          <ActionRow
            icon={Trash2}
            label={t("detail.delete")}
            destructive
            onClick={() => {
              if (confirm(t("detail.deleteConfirm"))) remove.mutate();
            }}
          />
        </section>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string | null;
  onCopy?: string | undefined;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-right text-[15px]">
        {value ?? <span className="text-muted-foreground">{t("field.none")}</span>}
        {onCopy ? (
          <button
            type="button"
            aria-label={t("detail.copy", { label })}
            onClick={async () => {
              await navigator.clipboard.writeText(onCopy);
              toast.success(t("detail.copied", { label }));
            }}
            className="text-primary"
          >
            <Copy className="size-4" aria-hidden />
          </button>
        ) : null}
      </span>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: typeof Share2;
  label: string;
  onClick: () => void;
  destructive?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] transition-colors hover:bg-muted/60 ${
        destructive ? "text-destructive" : ""
      }`}
    >
      <Icon className="size-5" strokeWidth={1.8} aria-hidden />
      {label}
    </button>
  );
}
