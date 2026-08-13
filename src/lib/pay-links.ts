/**
 * Payment hand-off links.
 *
 * pagoPA does not allow a third-party app to build a pre-filled Checkout URL
 * (pre-filling requires a `POST /carts` call reserved to the creditor body), so
 * the best possible hand-off is: open the official Checkout "pay a notice"
 * page, with the notice code and creditor fiscal code copied to the clipboard
 * so the user only has to paste them. The IO app is offered as an alternative
 * via its custom scheme, with a fallback to the public IO page.
 */
import { Capacitor, registerPlugin } from "@capacitor/core";
import { openUrl } from "@/lib/native-share";

interface AppLauncherPlugin {
  openPackageOrFallback(options: {
    packageName: string;
    fallbackUrl?: string;
  }): Promise<{ opened: "app" | "fallback" }>;
}

const AppLauncher = registerPlugin<AppLauncherPlugin>("AppLauncher");

/** IO's Android package name, used for the reliable native "is it installed" check. */
const IO_APP_PACKAGE = "it.pagopa.io.app";

/** Official pagoPA Checkout — "Paga un avviso" (guest, card/bank/apps). */
const PAGOPA_CHECKOUT_URL = "https://checkout.pagopa.it/inserisci-dati-avviso";

/**
 * pagoPA Checkout picks its language from `?lng=` (its i18next querystring
 * key — not the more obvious `lang`), read once on a fresh session and then
 * cached in its own localStorage. Without it, the page falls back to the
 * browser/WebView's locale, which for many users defaults to English.
 */
export function pagopaCheckoutUrl(lang: "it" | "en"): string {
  return `${PAGOPA_CHECKOUT_URL}?lng=${lang}`;
}

/**
 * Opens the pagoPA Checkout hand-off. Deliberately not a raw embedded
 * WebView: the in-app Custom Tab (see lib/native-share.ts) shares Chrome's
 * own cookies/session/saved cards, which a bare WebView wouldn't, and
 * payment flows sometimes rely on that (bank app hand-offs, autofill, etc).
 */
export const openCheckout = openUrl;

/** IO app custom scheme (opens the app when installed). */
export const IO_APP_SCHEME = "ioit://";
/** Public fallback when the IO app is not installed. */
export const IO_APP_URL = "https://ioapp.it/";

export type PayableNotice = {
  noticeNumber: string;
  taxCode: string;
};

/** Returns the pagoPA notice identifiers when the payment is payable, else null. */
export function payableNotice(payment: {
  notice_number: string | null;
  tax_code: string | null;
}): PayableNotice | null {
  const noticeNumber = (payment.notice_number ?? "").replace(/\D/g, "");
  const taxCode = (payment.tax_code ?? "").replace(/\D/g, "");
  if (noticeNumber.length !== 18 || taxCode.length !== 11) return null;
  return { noticeNumber, taxCode };
}

/**
 * Opens the IO app, falling back to the web page when it's not installed.
 *
 * Native: asks Android's package manager directly whether IO is installed —
 * reliable, no guessing. Web has no such API, so it falls back to the
 * classic custom-scheme-plus-timeout trick (best effort: it only opens the
 * fallback page if the browser is *still here* after a short wait, but
 * that "still here" check isn't guaranteed to reflect whether the app
 * actually opened).
 */
export async function openIoApp(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await AppLauncher.openPackageOrFallback({
      packageName: IO_APP_PACKAGE,
      fallbackUrl: IO_APP_URL,
    });
    return;
  }

  if (typeof window === "undefined") return;
  const start = Date.now();
  const fallback = window.setTimeout(() => {
    // Still here after the timeout => no app handled the scheme.
    if (Date.now() - start < 2500) window.location.href = IO_APP_URL;
  }, 1200);
  const onHide = () => window.clearTimeout(fallback);
  document.addEventListener("visibilitychange", onHide, { once: true });
  window.location.href = IO_APP_SCHEME;
}
