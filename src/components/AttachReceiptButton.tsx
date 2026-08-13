import { useRef, type ChangeEvent, type RefObject } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { attachDocument } from "@/lib/payments.functions";
import { MAX_DOCUMENT_BYTES } from "@/lib/payments";

/**
 * Attaches a receipt (proof of payment) to an existing payment — no OCR, no
 * QR reading, just upload + link. Stored in the dedicated `receipt_url`
 * slot, separate from an imported bill's own image/PDF.
 */
export function AttachReceiptButton({ paymentId }: { paymentId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const attach = useServerFn(attachDocument);
  const pdfRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("not_signed_in");

      const isPdf = file.type === "application/pdf";
      const extension = file.name.split(".").pop()?.toLowerCase() ?? (isPdf ? "pdf" : "jpg");
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) throw new Error(uploadError.message);

      return attach({ data: { id: paymentId, path, kind: "receipt" } });
    },
    onSuccess: () => {
      toast.success(t("detail.attach.success"));
      void queryClient.invalidateQueries({ queryKey: ["payment", paymentId] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const pick = (target: RefObject<HTMLInputElement | null>) => target.current?.click();

  const onPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error(t("import.tooLarge"));
      return;
    }
    upload.mutate(file);
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
          <Button variant="secondary" size="lg" disabled={upload.isPending}>
            <Paperclip className="size-4" aria-hidden /> {t("detail.attach")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
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
    </>
  );
}
