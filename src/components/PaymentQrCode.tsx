import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { nativeShareSupported, shareNativeFile, webShareSupportsFile } from "@/lib/native-share";
import { pagoPaPayload, type Payment } from "@/lib/payments";

/**
 * Shows the payment QR code so it can be scanned from another device or saved
 * as an image. Uses the payload captured at import time, or rebuilds a PagoPA
 * payload from the notice number, creditor fiscal code and amount.
 */
export function PaymentQrCode({ payment }: { payment: Payment }) {
  const { t } = useI18n();
  const payload = payment.qr_payload ?? pagoPaPayload(payment);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!payload) {
      setDataUrl(null);
      return;
    }
    let active = true;
    void QRCode.toDataURL(payload, { margin: 1, width: 512, errorCorrectionLevel: "M" })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch((error: unknown) => console.error("qr_render_failed", error));
    return () => {
      active = false;
    };
  }, [payload]);

  if (!payload || !dataUrl) return null;

  const fileName = `${payment.title.replace(/[^\w-]+/g, "-").slice(0, 40) || "pagamento"}-qr.png`;

  async function handleShare() {
    try {
      const blob = await fetch(dataUrl!).then((res) => res.blob());

      if (nativeShareSupported()) {
        await shareNativeFile(blob, fileName, payment.title);
        return;
      }

      const file = new File([blob], fileName, { type: blob.type });
      if (webShareSupportsFile(file)) {
        await navigator.share({ files: [file], title: payment.title });
        return;
      }

      // No share capability at all (older desktop browser) — fall back to
      // the same download the "Save" button does.
      const link = document.createElement("a");
      link.href = dataUrl!;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      // The user closing the share sheet isn't a failure worth a toast.
      if ((error as Error)?.name !== "AbortError") {
        toast.error(t("detail.qr.shareFailed"));
      }
    }
  }

  return (
    <section className="ios-card mb-6 p-5 text-center">
      <h2 className="flex items-center justify-center gap-2 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        <QrCode className="size-4" aria-hidden /> {t("detail.qr.title")}
      </h2>
      <img
        src={dataUrl}
        alt={t("detail.qr.alt", { title: payment.title })}
        className="mx-auto mt-4 w-48 max-w-full rounded-xl bg-white p-3"
        width={192}
        height={192}
      />
      <p className="mt-3 text-[13px] text-muted-foreground">{t("detail.qr.hint")}</p>
      <div className="mt-3 flex justify-center gap-2">
        <Button variant="secondary" size="sm" asChild>
          <a href={dataUrl} download={fileName}>
            <Download className="size-4" aria-hidden /> {t("detail.qr.save")}
          </a>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void handleShare()}>
          <Share2 className="size-4" aria-hidden /> {t("detail.qr.share")}
        </Button>
      </div>
    </section>
  );
}
