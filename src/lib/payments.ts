/**
 * Shared payment domain helpers: status derivation, formatting, category metadata.
 * Pure functions only so they are safe on both server and client.
 */
import type { Tables } from "@/integrations/supabase/types";
import type { Lang, Translate, TranslationKey } from "@/lib/i18n";
import { LOCALES } from "@/lib/i18n";

export type Payment = Tables<"payments">;
export type Category = Tables<"categories">;

export type PaymentStatus = Payment["status"];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "due_today",
  "upcoming",
  "paid",
  "expired",
  "archived",
  "cancelled",
];

export const CATEGORY_IDS = [
  "home",
  "utilities",
  "government",
  "taxes",
  "education",
  "healthcare",
  "transport",
  "insurance",
  "shopping",
  "subscriptions",
  "business",
  "other",
] as const;

/** Translated category name, falling back to the raw id for unknown values. */
export function categoryLabel(t: Translate, id: string): string {
  const key = `category.${id}` as TranslationKey;
  const label = t(key);
  return label === key ? id : label;
}

/** Days between today and the due date (negative when overdue). */
export function daysUntil(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Status shown in the UI. Stored statuses that are terminal (paid, archived,
 * cancelled) always win; open payments are derived from their due date.
 */
export function effectiveStatus(payment: Payment): PaymentStatus {
  if (payment.status === "paid" || payment.status === "archived" || payment.status === "cancelled") {
    return payment.status;
  }
  const days = daysUntil(payment.due_date);
  if (days === null) return "pending";
  if (days < 0) return "expired";
  if (days === 0) return "due_today";
  if (days <= 7) return "upcoming";
  return "pending";
}

export const STATUS_TONES: Record<PaymentStatus, Tone> = {
  pending: "neutral",
  due_today: "danger",
  upcoming: "warning",
  paid: "success",
  expired: "danger",
  archived: "neutral",
  cancelled: "neutral",
};

/** Translated status label. */
export function statusLabel(t: Translate, status: PaymentStatus): string {
  return t(`status.${status}` as TranslationKey);
}

export type Tone = "neutral" | "success" | "warning" | "danger" | "primary";

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/16 text-warning",
  danger: "bg-destructive/12 text-destructive",
  primary: "bg-primary/12 text-primary",
};

export function formatAmount(amount: number | string | null, lang: Lang = "it"): string {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  return new Intl.NumberFormat(LOCALES[lang], { style: "currency", currency: "EUR" }).format(value);
}

export function formatDate(
  date: string | null,
  lang: Lang = "it",
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(LOCALES[lang], opts ?? {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

/** Human relative label, e.g. "Tra 3 giorni" / "Scaduto da 5 giorni". */
export function dueLabel(dueDate: string | null, t: Translate): string {
  const days = daysUntil(dueDate);
  if (days === null) return t("due.none");
  if (days === 0) return t("due.today");
  if (days === 1) return t("due.tomorrow");
  if (days > 1) return t("due.inDays", { days });
  if (days === -1) return t("due.overdue.one");
  return t("due.overdue.other", { days: Math.abs(days) });
}

/**
 * Single-phrase status text for compact row badges — avoids the redundancy
 * of pairing a status word with a due label that already says the same
 * thing (e.g. "Scaduto · Scaduto da 3 giorni", "Scade oggi · Scade oggi").
 */
export function rowStatusText(t: Translate, status: PaymentStatus, dueDate: string | null): string {
  if (status === "paid" || status === "archived" || status === "cancelled") {
    return statusLabel(t, status);
  }
  if (status === "due_today" || status === "expired") {
    return dueLabel(dueDate, t);
  }
  const days = daysUntil(dueDate);
  if (days === null) return t("due.none");
  if (status === "upcoming") {
    return days === 1 ? t("row.upcomingTomorrow") : t("row.upcomingInDays", { days });
  }
  return t("row.pendingInDays", { days });
}

/**
 * Rebuilds the PagoPA QR payload from the stored notice data, so a payment
 * entered by hand can still show a scannable code.
 * Format: PAGOPA|002|<notice number>|<creditor fiscal code>|<amount in cents>
 */
export function pagoPaPayload(payment: {
  notice_number: string | null;
  tax_code: string | null;
  amount: number | string | null;
}): string | null {
  const notice = (payment.notice_number ?? "").replace(/\D/g, "");
  const taxCode = (payment.tax_code ?? "").replace(/\D/g, "");
  const amount = typeof payment.amount === "string" ? Number(payment.amount) : (payment.amount ?? 0);
  if (notice.length !== 18 || taxCode.length !== 11 || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return `PAGOPA|002|${notice}|${taxCode}|${Math.round(amount * 100)}`;
}

export function isOpen(payment: Payment): boolean {
  const status = effectiveStatus(payment);
  return status !== "paid" && status !== "archived" && status !== "cancelled";
}

/**
 * Removes keys whose value is `undefined` so Supabase inserts/updates satisfy
 * `exactOptionalPropertyTypes` (absent key vs explicit undefined).
 */
export function stripUndefined<T extends object>(obj: T): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as {
    [K in keyof T]: Exclude<T[K], undefined>;
  };
}

/** Shape of the quick-add / edit form payload sent to the server. */
export type PaymentFormValues = {
  title: string;
  entity: string | null;
  amount: number;
  due_date: string | null;
  category: string;
  notice_number: string | null;
  tax_code: string | null;
  iban: string | null;
  notes: string | null;
  tags: string[];
  /** Raw QR payload captured when importing a notice. */
  qr_payload?: string | null;
};
