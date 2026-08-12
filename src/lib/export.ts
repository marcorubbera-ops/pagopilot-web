/**
 * Payment export: CSV/PDF generation plus the actual cross-platform save.
 *
 * Both formats are built client-side — the data is already fetched into the
 * browser (same as the rest of the app), and jsPDF needs `document`/`Blob`,
 * which the Cloudflare Workers backend doesn't have.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Lang, Translate } from "@/lib/i18n";
import { nativeShareSupported, shareNativeFile } from "@/lib/native-share";
import {
  categoryLabel,
  effectiveStatus,
  formatAmount,
  formatDate,
  rowStatusText,
  type Payment,
} from "@/lib/payments";

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportFilename(format: "csv" | "pdf"): string {
  return `pagopilot-${dateStamp()}.${format}`;
}

export function paymentsToCsv(payments: Payment[]): string {
  const header = "title,entity,amount,due_date,status,category,notice_number\n";
  const body = payments
    .map((payment) =>
      [
        payment.title,
        payment.entity ?? "",
        payment.amount,
        payment.due_date ?? "",
        effectiveStatus(payment),
        payment.category,
        payment.notice_number ?? "",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  return header + body;
}

export function paymentsToPdfBlob(payments: Payment[], t: Translate, lang: Lang): Blob {
  const doc = new jsPDF();
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PagoPilot", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 120);
  doc.text(t("export.pdf.generatedOn", { date: formatDate(dateStamp(), lang) }), 14, 25);
  doc.text(
    t("export.pdf.summary", { count: payments.length, total: formatAmount(total, lang) }),
    14,
    31,
  );

  autoTable(doc, {
    startY: 37,
    head: [
      [
        t("export.pdf.col.title"),
        t("export.pdf.col.entity"),
        t("export.pdf.col.amount"),
        t("export.pdf.col.due"),
        t("export.pdf.col.status"),
        t("export.pdf.col.category"),
      ],
    ],
    body: payments.map((payment) => [
      payment.title,
      payment.entity ?? "",
      formatAmount(payment.amount, lang),
      formatDate(payment.due_date, lang),
      rowStatusText(t, effectiveStatus(payment), payment.due_date),
      categoryLabel(t, payment.category),
    ]),
    theme: "striped",
    headStyles: { fillColor: [47, 111, 237], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 246, 251] },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 2: { halign: "right" } },
  });

  return doc.output("blob");
}

/**
 * Saves an exported file. On native Android, `<a download>` inside a
 * remote-loaded Capacitor WebView isn't reliable — writes to the app's cache
 * and hands it to the OS share sheet instead. On web, the fix is just doing
 * the anchor click properly: attached to the DOM, and not revoking the blob
 * URL before the browser has had a chance to read it.
 */
export async function downloadExportFile(blob: Blob, filename: string): Promise<void> {
  if (nativeShareSupported()) {
    await shareNativeFile(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
