import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  STATUS_TONES,
  TONE_CLASSES,
  categoryLabel,
  dueLabel,
  effectiveStatus,
  formatAmount,
  statusLabel,
  type Payment,
} from "@/lib/payments";

/** One row in a grouped list of payments. */
export function PaymentRow({ payment }: { payment: Payment }) {
  const { t, lang } = useI18n();
  const status = effectiveStatus(payment);

  return (
    <Link
      to="/payments/$id"
      params={{ id: payment.id }}
      className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/60"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{payment.title}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {payment.entity ? `${payment.entity} · ` : ""}
          {categoryLabel(t, payment.category)}
        </p>
        <span
          className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[STATUS_TONES[status]]}`}
        >
          {statusLabel(t, status)} · {dueLabel(payment.due_date, t)}
        </span>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-semibold tabular-nums">{formatAmount(payment.amount, lang)}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

/** Inset grouped section wrapper, iOS table style. */
export function ListSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      {title ? (
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      ) : null}
      <div className="ios-card divide-y divide-border/70 overflow-hidden">{children}</div>
    </section>
  );
}
