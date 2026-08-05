import jsQR from "jsqr";

export type PagoPaQr = {
  /** Raw decoded QR text. */
  raw: string;
  /** 18-digit "Codice Avviso". */
  noticeNumber?: string;
  /** 11-digit fiscal code of the creditor body. */
  taxCode?: string;
  /** Amount in euro. */
  amount?: number;
};

/**
 * Parses a PagoPA QR payload, e.g.
 * `PAGOPA|002|300012618400258512|00108690470|1720`
 * (last field is the amount in cents).
 */
export function parsePagoPaQr(raw: string): PagoPaQr {
  const result: PagoPaQr = { raw };
  const parts = raw.split("|").map((part) => part.trim());
  if (parts[0]?.toUpperCase() === "PAGOPA") {
    const notice = parts[2]?.replace(/\D/g, "");
    const tax = parts[3]?.replace(/\D/g, "");
    const cents = parts[4]?.replace(/\D/g, "");
    if (notice && notice.length >= 15) result.noticeNumber = notice;
    if (tax && tax.length === 11) result.taxCode = tax;
    if (cents) {
      const amount = Number(cents) / 100;
      if (Number.isFinite(amount) && amount > 0) result.amount = amount;
    }
    return result;
  }
  // Fallback: some notices encode only the digits.
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 18) result.noticeNumber = digits;
  return result;
}

async function decodeBitmap(bitmap: ImageBitmap, scale: number): Promise<string | null> {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const code = jsQR(data, width, height, { inversionAttempts: "attemptBoth" });
  return code?.data ?? null;
}

/**
 * Reads a PagoPA QR code out of a photo/screenshot of a payment notice.
 * Returns null when no QR code can be decoded.
 */
export async function readQrFromImage(file: File): Promise<PagoPaQr | null> {
  if (typeof document === "undefined") return null;
  try {
    const bitmap = await createImageBitmap(file);
    // Try a few resolutions: QR decoding is sensitive to sampling.
    const longest = Math.max(bitmap.width, bitmap.height);
    const scales = [1, 1600 / longest, 1000 / longest, 2].filter((scale) => scale > 0 && scale <= 4);
    for (const scale of scales) {
      const raw = await decodeBitmap(bitmap, scale);
      if (raw) {
        bitmap.close?.();
        return parsePagoPaQr(raw);
      }
    }
    bitmap.close?.();
    return null;
  } catch (error) {
    console.error("qr_decode_failed", error);
    return null;
  }
}
