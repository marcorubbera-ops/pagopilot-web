import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, QrCode, X } from "lucide-react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { parsePagoPaQr, type PagoPaQr } from "@/lib/pagopa-qr";

type ScanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Receives the captured frame as a JPEG file (bill photo or QR frame).
   * `qr` is already-decoded when the live scan found a code — re-decoding
   * the captured still frame is unreliable (a downscaled preview frame can
   * decode fine while the full-resolution capture of the same moment doesn't).
   */
  onCapture: (file: File, qr?: PagoPaQr | null) => void;
};

/**
 * Live camera scanner: streams the rear camera, looks for a PagoPA QR code on
 * every frame and captures automatically when it finds one. The shutter button
 * captures the current frame for AI reading of a bill without a QR code.
 */
export function ScanDialog({ open, onOpenChange, onCapture }: ScanDialogProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const frameToFile = useCallback((name: string): File | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = (canvasRef.current ??= document.createElement("canvas"));
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const binary = atob(dataUrl.split(",")[1] ?? "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], name, { type: "image/jpeg" });
  }, []);

  const finish = useCallback(
    (name: string, qr?: PagoPaQr | null) => {
      if (doneRef.current) return;
      const file = frameToFile(name);
      if (!file) return;
      doneRef.current = true;
      stop();
      onOpenChange(false);
      onCapture(file, qr);
    },
    [frameToFile, onCapture, onOpenChange, stop],
  );

  useEffect(() => {
    if (!open) {
      stop();
      setFound(false);
      setError(null);
      doneRef.current = false;
      return;
    }

    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        const tick = () => {
          if (cancelled || doneRef.current) return;
          const canvas = (canvasRef.current ??= document.createElement("canvas"));
          if (video.videoWidth) {
            const width = Math.min(960, video.videoWidth);
            const scale = width / video.videoWidth;
            canvas.width = width;
            canvas.height = Math.round(video.videoHeight * scale);
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(data, canvas.width, canvas.height, { inversionAttempts: "attemptBoth" });
              if (code?.data) {
                setFound(true);
                finish("scan-qr.jpg", parsePagoPaQr(code.data));
                return;
              }
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (cause) {
        console.error("camera_failed", cause);
        if (!cancelled) setError(t("scan.denied"));
      }
    }
    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, finish, stop, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4">
        <DialogHeader>
          <DialogTitle>{t("scan.title")}</DialogTitle>
          <DialogDescription>{t("scan.description")}</DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">{error}</p>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-foreground/90">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-[3/4] w-full object-cover"
              aria-label={t("scan.title")}
            />
            <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-background/80" />
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-background/85 px-3 py-1 text-xs font-medium backdrop-blur">
                <QrCode className="size-3.5" aria-hidden />
                {found ? t("scan.found") : t("scan.searching")}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            <X className="size-4" aria-hidden />
            {t("common.cancel")}
          </Button>
          <Button className="flex-1" disabled={!!error} onClick={() => finish("scan-photo.jpg")}>
            <Camera className="size-4" aria-hidden />
            {t("scan.shoot")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
