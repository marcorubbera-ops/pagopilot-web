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

/** Official pagoPA Checkout — "Paga un avviso" (guest, card/bank/apps). */
export const PAGOPA_CHECKOUT_URL = "https://checkout.pagopa.it/inserisci-dati-avviso";
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

/** Opens the IO app, falling back to the web page when the scheme is unhandled. */
export function openIoApp(): void {
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
