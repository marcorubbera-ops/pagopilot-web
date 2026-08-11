/**
 * Pushes the next-due payment to the Android home-screen widget. Runs only
 * inside the native Capacitor app — a no-op on web/iOS, where there's no
 * widget to update.
 */
import { Capacitor, registerPlugin } from "@capacitor/core";
import { dueLabel, formatAmount, type Payment } from "@/lib/payments";
import type { Translate, Lang } from "@/lib/i18n";

interface WidgetBridgePlugin {
  updateNextPayment(data: {
    empty: boolean;
    title?: string;
    entity?: string;
    amountLabel?: string;
    dueLabel?: string;
  }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>("WidgetBridge");

export function widgetBridgeSupported(): boolean {
  return Capacitor.getPlatform() === "android";
}

/** Pushes (or clears) the "next payment" widget snapshot. Safe to call on every payments refetch. */
export async function syncNextPaymentWidget(
  payment: Payment | null,
  t: Translate,
  lang: Lang,
): Promise<void> {
  if (!widgetBridgeSupported()) return;

  if (!payment) {
    await WidgetBridge.updateNextPayment({ empty: true });
    return;
  }

  await WidgetBridge.updateNextPayment({
    empty: false,
    title: payment.title,
    entity: payment.entity ?? "",
    amountLabel: formatAmount(payment.amount, lang),
    dueLabel: dueLabel(payment.due_date, t),
  });
}
