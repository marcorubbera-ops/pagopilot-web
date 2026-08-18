import { useEffect, useState } from "react";
import { ScanFace } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { isUnlockedForSession, lockEnabled, unlockWithBiometrics } from "@/lib/applock";

/**
 * Full-screen gate shown when the app lock is on and this session has not been
 * unlocked yet. Renders children untouched otherwise.
 */
export function AppLock({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLocked(lockEnabled() && !isUnlockedForSession());
  }, []);

  async function unlock() {
    setBusy(true);
    try {
      await unlockWithBiometrics();
      setLocked(false);
    } catch {
      toast.error(t("lock.failed"));
    } finally {
      setBusy(false);
    }
  }

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-8 text-center">
      <img
        src="/favicon.png"
        alt="PagoPilot"
        className="size-20 rounded-[22px] shadow-sm"
        width={80}
        height={80}
      />
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t("lock.title")}</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">{t("lock.copy")}</p>
      </div>
      <Button size="lg" className="w-full max-w-xs" onClick={unlock} disabled={busy}>
        <ScanFace className="size-5" strokeWidth={1.8} aria-hidden /> {t("lock.unlock")}
      </Button>
    </div>
  );
}
