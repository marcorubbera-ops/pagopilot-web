import { useRef, useState, type ChangeEvent, type RefObject } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, FileText, Image as ImageIcon, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImportMultiDialog } from "@/components/ImportMultiDialog";
import { PremiumDialog } from "@/components/PremiumDialog";
import { QuickAddDialog, type FormShape } from "@/components/QuickAddDialog";
import { ScanDialog } from "@/components/ScanDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { extractPaymentFromDocument, type ExtractedPayment } from "@/lib/documents.functions";
import { readQrFromImage } from "@/lib/pagopa-qr";
import { attachDocument, createPayment } from "@/lib/payments.functions";
import { getProfile } from "@/lib/profile.functions";
import { CATEGORY_IDS, MAX_DOCUMENT_BYTES, type PaymentFormValues } from "@/lib/payments";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Picks a photo or PDF, uploads it to the private documents bucket, extracts
 * the payment details with AI, then opens the form prefilled for review.
 */
export function ImportDocumentButton({ className }: { className?: string }) {
  const { t, lang } = useI18n();
  const pdfRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const extract = useServerFn(extractPaymentFromDocument);
  const addPayment = useServerFn(createPayment);
  const attach = useServerFn(attachDocument);
  const fetchProfile = useServerFn(getProfile);

  const [busy, setBusy] = useState<null | "uploading" | "analyzing">(null);
  const [formOpen, setFormOpen] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [prefill, setPrefill] = useState<Partial<FormShape>>({});
  const [upload, setUpload] = useState<{ path: string; kind: "image" | "pdf" } | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [multiOpen, setMultiOpen] = useState(false);
  const [multiItems, setMultiItems] = useState<ExtractedPayment[]>([]);

  const { data: account } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const create = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      const created = await addPayment({ data: { ...values, qr_payload: qrPayload } });
      if (upload) await attach({ data: { id: created.id, path: upload.path, kind: upload.kind } });
      return created;
    },
    onSuccess: () => {
      toast.success(t("form.saved"));
      setUpload(null);
      setQrPayload(null);
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function toPaymentValues(item: ExtractedPayment, index: number): PaymentFormValues {
    const category =
      item.category && (CATEGORY_IDS as readonly string[]).includes(item.category)
        ? item.category
        : "other";
    return {
      title: item.title ?? `Pagamento ${index + 1}`,
      entity: item.entity ?? null,
      amount: item.amount ?? 0,
      due_date: /^\d{4}-\d{2}-\d{2}$/.test(item.due_date ?? "") ? item.due_date! : null,
      category,
      notice_number: item.notice_number ? item.notice_number.replace(/\s+/g, "") : null,
      tax_code: item.tax_code ? item.tax_code.replace(/\s+/g, "") : null,
      iban: item.iban ? item.iban.replace(/\s+/g, "") : null,
      notes: item.description ?? null,
      tags: [],
    };
  }

  async function handleImportMulti(items: ExtractedPayment[]) {
    for (const [index, item] of items.entries()) {
      const created = await addPayment({ data: toPaymentValues(item, index) });
      if (upload) await attach({ data: { id: created.id, path: upload.path, kind: upload.kind } });
    }
    toast.success(t("form.saved"));
    setUpload(null);
    void queryClient.invalidateQueries({ queryKey: ["payments"] });
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
    void queryClient.invalidateQueries({ queryKey: ["reminders"] });
  }

  async function handleFile(file: File) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error(t("import.tooLarge"));
      return;
    }
    const isPdf = file.type === "application/pdf";
    try {
      setBusy("uploading");
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("not_signed_in");

      const extension = file.name.split(".").pop()?.toLowerCase() ?? (isPdf ? "pdf" : "jpg");
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) throw new Error(uploadError.message);
      setUpload({ path, kind: isPdf ? "pdf" : "image" });

      // Photos and PDFs both go through AI extraction. A QR code, when
      // present, is decoded locally and is already a complete, reliable
      // result on its own — so a failed AI call must not throw it away.
      setBusy("analyzing");
      const dataUrl = await readAsDataUrl(file);
      const qr = isPdf ? null : await readQrFromImage(file);
      let extractedList: ExtractedPayment[] = [];
      try {
        extractedList = await extract({ data: { dataUrl, filename: file.name, lang } });
      } catch (error) {
        console.error("AI extraction failed:", error);
        if (!qr) throw error;
      }

      if (extractedList.length > 1) {
        // Multiple distinct payments in one document (e.g. several
        // installments) — review as a list instead of one prefilled form.
        setMultiItems(extractedList);
        setMultiOpen(true);
        return;
      }

      const extracted = extractedList[0] ?? {};
      const category =
        extracted.category && (CATEGORY_IDS as readonly string[]).includes(extracted.category)
          ? extracted.category
          : "other";
      setQrPayload(qr?.raw ?? null);
      // The QR payload is machine-readable, so it wins over OCR guesses.
      const amount = qr?.amount ?? extracted.amount;
      const values: Partial<FormShape> = {
        title: extracted.title ?? file.name.replace(/\.[^.]+$/, ""),
        entity: extracted.entity ?? "",
        amount: amount != null ? String(amount) : "",
        due_date: /^\d{4}-\d{2}-\d{2}$/.test(extracted.due_date ?? "") ? extracted.due_date! : "",
        category,
        notice_number: (qr?.noticeNumber ?? extracted.notice_number ?? "").replace(/\s+/g, ""),
        tax_code: (qr?.taxCode ?? extracted.tax_code ?? "").replace(/\s+/g, ""),
        iban: (extracted.iban ?? "").replace(/\s+/g, ""),
        notes: extracted.description ?? "",
      };
      if (qr || extractedList.length > 0) {
        toast.success(qr ? t("import.successQr") : t("import.success"));
      } else {
        // A well-formed but empty result — Gemini looked and found no
        // payment on the page. Not an error; let the user fill it in by hand.
        toast.error(t("import.fail"));
      }

      setPrefill(values);
      setFormOpen(true);
    } catch (error) {
      console.error("Import failed:", error);

      setPrefill({
        title: file.name.replace(/\.[^.]+$/, ""),
      });

      setFormOpen(true);

      toast.error(t("import.fail"));
    } finally {
      setBusy(null);
    }
  }

  const importsLeft = account?.importsLeft ?? null;
  const blocked = importsLeft !== null && importsLeft <= 0;

  const pick = (target: RefObject<HTMLInputElement | null>) => {
    if (blocked) {
      setPaywall(true);
      return;
    }
    target.current?.click();
  };

  const onPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleFile(file);
  };

  return (
    <>
      <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={onPicked} />
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={onPicked} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPicked}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="lg" className={className} disabled={busy !== null}>
            <ScanLine className="size-4" aria-hidden />
            {busy === "analyzing"
              ? t("import.analyzing")
              : busy === "uploading"
                ? t("import.uploading")
                : t("home.import")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          <DropdownMenuItem
            onSelect={() => (blocked ? setPaywall(true) : setScanOpen(true))}
          >
            <ScanLine className="size-4" aria-hidden />
            {t("import.menu.scan")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => pick(cameraRef)}>
            <Camera className="size-4" aria-hidden />
            {t("import.menu.camera")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => pick(imageRef)}>
            <ImageIcon className="size-4" aria-hidden />
            {t("import.menu.image")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => pick(pdfRef)}>
            <FileText className="size-4" aria-hidden />
            {t("import.menu.pdf")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ScanDialog open={scanOpen} onOpenChange={setScanOpen} onCapture={(file) => void handleFile(file)} />

      <PremiumDialog
        open={paywall}
        onOpenChange={setPaywall}
        premium={account?.premium ?? false}
        reason={t("import.limit.copy", { limit: account?.importLimit ?? 5 })}
      />

      <QuickAddDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaults={prefill}
        title={t("import.review")}
        description={t("import.hint")}
        onSubmit={(values) => create.mutateAsync(values)}
      />

      <ImportMultiDialog
        open={multiOpen}
        onOpenChange={setMultiOpen}
        items={multiItems}
        onImport={handleImportMulti}
      />
    </>
  );
}
