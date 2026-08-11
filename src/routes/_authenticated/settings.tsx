import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BellRing,
  ChevronRight,
  Crown,
  Download,
  Info,
  LogOut,
  Languages,
  ScanFace,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PremiumDialog } from "@/components/PremiumDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGES, useI18n } from "@/lib/i18n";
import { listPayments } from "@/lib/payments.functions";
import { getProfile } from "@/lib/profile.functions";
import { effectiveStatus } from "@/lib/payments";
import { biometricsSupported, disableLock, enableLock, lockEnabled } from "@/lib/applock";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Impostazioni — PagoPilot" },
      {
        name: "description",
        content: "Lingua, piano Premium, promemoria ed export dei tuoi dati.",
      },
      { property: "og:title", content: "Impostazioni — PagoPilot" },
      { property: "og:description", content: "Gestisci account, lingua e piano." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const fetchProfile = useServerFn(getProfile);
  const fetchPayments = useServerFn(listPayments);
  const [paywall, setPaywall] = useState(false);
  const [lockOn, setLockOn] = useState(false);
  const [lockSupported, setLockSupported] = useState(true);

  useEffect(() => {
    setLockOn(lockEnabled());
    setLockSupported(biometricsSupported());
  }, []);

  async function toggleLock(next: boolean) {
    if (!next) {
      disableLock();
      setLockOn(false);
      toast.success(t("settings.lock.off"));
      return;
    }
    if (!lockSupported) {
      toast.error(t("settings.lock.unsupported"));
      return;
    }
    try {
      await enableLock(account?.profile?.email ?? "PagoPilot");
      setLockOn(true);
      toast.success(t("settings.lock.on"));
    } catch {
      toast.error(t("settings.lock.error"));
    }
  }

  const { data: account } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const { data: payments } = useQuery({ queryKey: ["payments"], queryFn: () => fetchPayments() });
  const premium = account?.premium ?? false;

  function exportCsv() {
    if (!premium) {
      setPaywall(true);
      return;
    }
    const rows = payments ?? [];
    const header = "title,entity,amount,due_date,status,category\n";
    const body = rows
      .map((payment) =>
        [
          payment.title,
          payment.entity ?? "",
          payment.amount,
          payment.due_date ?? "",
          effectiveStatus(payment),
          payment.category,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([header + body], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pagopilot.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("stats.exported"));
  }

  return (
    <AppShell title={t("settings.title")}>
      <Section title={t("settings.account")}>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[15px]">{account?.profile?.email ?? "—"}</span>
        </div>
      </Section>

      <Section title={t("settings.plan")}>
        <button
          type="button"
          onClick={() => setPaywall(true)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-3">
            <Crown className="size-5 text-primary" strokeWidth={1.8} aria-hidden />
            <span>
              <span className="block text-[15px]">
                {premium ? t("settings.plan.premium") : t("settings.plan.free")}
              </span>
              {!premium && account?.importsLeft !== null && account?.importsLeft !== undefined ? (
                <span className="block text-[13px] text-muted-foreground">
                  {account.importsLeft === 0
                    ? t("import.remaining.none")
                    : t("import.remaining", { count: account.importsLeft })}
                </span>
              ) : null}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </button>
      </Section>

      <Section title={t("settings.language")}>
        {LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLang(item.id)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex items-center gap-3 text-[15px]">
              <Languages className="size-5 text-muted-foreground" strokeWidth={1.8} aria-hidden />
              {item.label}
            </span>
            {item.id === lang ? <span className="text-[15px] text-primary">✓</span> : null}
          </button>
        ))}
      </Section>

      <Section title={t("settings.security")}>
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <span className="flex min-w-0 items-start gap-3">
            <ScanFace
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              strokeWidth={1.8}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-[15px]">{t("settings.lock")}</span>
              <span className="block text-[13px] text-muted-foreground">
                {lockSupported ? t("settings.lock.copy") : t("settings.lock.unsupported")}
              </span>
            </span>
          </span>
          <Switch
            checked={lockOn}
            disabled={!lockSupported}
            onCheckedChange={(next) => void toggleLock(next)}
            aria-label={t("settings.lock")}
          />
        </div>
      </Section>

      <Section title={t("settings.reminders")}>
        <div className="flex items-start gap-3 px-4 py-3">
          <BellRing className="mt-0.5 size-5 text-muted-foreground" strokeWidth={1.8} aria-hidden />
          <p className="text-[13px] text-muted-foreground">{t("settings.reminders.copy")}</p>
        </div>
      </Section>

      <Section title={t("settings.data")}>
        <button
          type="button"
          onClick={exportCsv}
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px]"
        >
          <Download className="size-5 text-muted-foreground" strokeWidth={1.8} aria-hidden />
          {t("settings.export")}
        </button>
      </Section>

      <Section title={t("settings.about")}>
        <div className="flex items-start gap-3 px-4 py-3">
          <Info className="mt-0.5 size-5 text-muted-foreground" strokeWidth={1.8} aria-hidden />
          <p className="text-[13px] text-muted-foreground">{t("settings.about.copy")}</p>
        </div>
        <Link
          to="/privacy"
          target="_blank"
          className="flex items-center justify-between px-4 py-3 text-[15px] text-foreground active:bg-muted/60"
        >
          {t("legal.privacy")}
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
        <Link
          to="/terms"
          target="_blank"
          className="flex items-center justify-between px-4 py-3 text-[15px] text-foreground active:bg-muted/60"
        >
          {t("legal.terms")}
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
      </Section>

      <Button
        variant="secondary"
        className="w-full text-destructive"
        onClick={async () => {
          await supabase.auth.signOut();
          void router.navigate({ to: "/auth" });
        }}
      >
        <LogOut className="size-4" aria-hidden /> {t("auth.signout")}
      </Button>

      <PremiumDialog open={paywall} onOpenChange={setPaywall} premium={premium} />
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-1.5 px-4 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="ios-card divide-y divide-border/60 overflow-hidden">{children}</div>
    </section>
  );
}
