import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPayments } from "@/lib/payments.functions";
import { findNextDue } from "@/lib/payments";
import { useI18n } from "@/lib/i18n";
import { syncNextPaymentWidget, widgetBridgeSupported } from "@/lib/widget-bridge";

/**
 * Keeps the Android "next payment" home-screen widget in sync with the
 * signed-in user's payments. No-op off Android; mount once near the app
 * root so it covers every authenticated screen, not just Home.
 */
export function useWidgetSync(): void {
  const fetchPayments = useServerFn(listPayments);
  const { t, lang } = useI18n();
  const supported = widgetBridgeSupported();

  const { data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: () => fetchPayments(),
    enabled: supported,
  });

  useEffect(() => {
    if (!supported || !payments) return;
    void syncNextPaymentWidget(findNextDue(payments), t, lang);
  }, [supported, payments, t, lang]);
}
