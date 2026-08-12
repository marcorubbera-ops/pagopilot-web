import { CreditCard, ExternalLink, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { openIoApp, pagopaCheckoutUrl, payableNotice } from "@/lib/pay-links";
import { formatAmount, type Payment } from "@/lib/payments";

/**
 * "Pay now" hand-off: copies the notice identifiers and opens the official
 * pagoPA Checkout, with the IO app as an alternative.
 */
export function PayNowButton({ payment, className }: { payment: Payment; className?: string }) {
  const { t, lang } = useI18n();
  const notice = payableNotice(payment);
  if (!notice) return null;

  const openCheckout = async () => {
    try {
      await navigator.clipboard.writeText(notice.noticeNumber);
      toast.success(t("pay.copied", { code: notice.noticeNumber }));
    } catch {
      // Clipboard can be blocked: the Checkout page still works manually.
    }
    window.open(pagopaCheckoutUrl(lang), "_blank", "noopener,noreferrer");
  };

  return (
    <section className={`ios-card mb-6 p-5 ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        <CreditCard className="size-4" aria-hidden /> {t("pay.title")}
      </h2>
      <p className="mt-2 text-[13px] text-muted-foreground">{t("pay.hint")}</p>
      <div className="mt-4 grid gap-2">
        <Button size="lg" onClick={() => void openCheckout()}>
          <ExternalLink className="size-4" aria-hidden />{" "}
          {t("pay.checkout", { amount: formatAmount(payment.amount, lang) })}
        </Button>
        <Button variant="secondary" size="lg" onClick={openIoApp}>
          <Smartphone className="size-4" aria-hidden /> {t("pay.io")}
        </Button>
      </div>
    </section>
  );
}
