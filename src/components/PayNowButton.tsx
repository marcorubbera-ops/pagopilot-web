import { Copy, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { pagopaCheckoutUrl, payableNotice } from "@/lib/pay-links";
import { formatAmount, type Payment } from "@/lib/payments";

/**
 * "Pay now" hand-off: shows the notice identifiers pagoPA Checkout asks for
 * (copyable individually — clipboard writes can silently fail in the
 * Android WebView, so the values are visible as plain text regardless) and
 * opens the official pagoPA Checkout.
 */
export function PayNowButton({ payment, className }: { payment: Payment; className?: string }) {
  const { t, lang } = useI18n();
  const notice = payableNotice(payment);
  if (!notice) return null;

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      // Clipboard can be blocked — the value is already shown as text above.
    }
  }

  return (
    <section className={`ios-card mb-6 p-5 ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        <CreditCard className="size-4" aria-hidden /> {t("pay.title")}
      </h2>
      <p className="mt-2 text-[13px] text-muted-foreground">{t("pay.hint")}</p>

      <div className="mt-3 space-y-2">
        <CodeRow
          label={t("field.noticeNumber")}
          value={notice.noticeNumber}
          onCopy={() => void copy(notice.noticeNumber, t("pay.copied", { code: notice.noticeNumber }))}
        />
        <CodeRow
          label={t("field.taxCode")}
          value={notice.taxCode}
          onCopy={() => void copy(notice.taxCode, t("pay.copiedTaxCode", { code: notice.taxCode }))}
        />
      </div>

      <Button size="lg" className="mt-4 w-full" asChild>
        <a href={pagopaCheckoutUrl(lang)} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4" aria-hidden />{" "}
          {t("pay.checkout", { amount: formatAmount(payment.amount, lang) })}
        </a>
      </Button>
    </section>
  );
}

function CodeRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
      <span>
        <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="block font-mono text-[13px]">{value}</span>
      </span>
      <Button variant="ghost" size="icon" className="shrink-0" onClick={onCopy} aria-label={t("pay.copy")}>
        <Copy className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
