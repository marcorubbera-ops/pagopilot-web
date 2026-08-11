import type { ReactNode } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { downloadExportFile, exportFilename, paymentsToCsv, paymentsToPdfBlob } from "@/lib/export";
import type { Payment } from "@/lib/payments";

/** CSV/PDF export, gated behind Premium — shared by Settings and Stats. */
export function ExportMenu({
  payments,
  premium,
  onPaywall,
  trigger,
}: {
  payments: Payment[];
  premium: boolean;
  onPaywall: () => void;
  trigger: ReactNode;
}) {
  const { t, lang } = useI18n();

  async function exportAs(format: "csv" | "pdf") {
    if (!premium) {
      onPaywall();
      return;
    }
    try {
      const blob =
        format === "csv"
          ? new Blob([paymentsToCsv(payments)], { type: "text/csv;charset=utf-8" })
          : paymentsToPdfBlob(payments, t, lang);
      await downloadExportFile(blob, exportFilename(format));
      toast.success(t("stats.exported"));
    } catch {
      toast.error(t("stats.exportFailed"));
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        <DropdownMenuItem onSelect={() => void exportAs("csv")}>
          <FileSpreadsheet className="size-4" aria-hidden />
          {t("export.menu.csv")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exportAs("pdf")}>
          <FileText className="size-4" aria-hidden />
          {t("export.menu.pdf")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
