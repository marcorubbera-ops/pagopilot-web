import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bell, CalendarDays, ScanLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURES = [
  { icon: ScanLine, id: "import" },
  { icon: Bell, id: "reminders" },
  { icon: CalendarDays, id: "calendar" },
  { icon: ShieldCheck, id: "privacy" },
] as const;

function Landing() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void router.navigate({ to: "/home" });
    });
  }, [router]);

  return (
    <main className="min-h-screen bg-background px-6 py-14">
      <div className="mx-auto max-w-md">
        <div className="mb-2 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-3xl bg-primary/12">
            <ShieldCheck className="size-8 text-primary" strokeWidth={1.8} aria-hidden />
          </div>
          <h1 className="large-title">PagoPilot</h1>
          <p className="mt-3 text-[17px] text-muted-foreground">{t("landing.hero")}</p>
          <div className="mt-7 flex flex-col gap-3">
            <Button asChild size="lg">
              <Link to="/auth">{t("landing.cta.primary")}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">{t("landing.cta.secondary")}</Link>
            </Button>
          </div>
        </div>

        <ul className="space-y-3">
          {FEATURES.map(({ icon: Icon, id }) => (
            <li key={id} className="ios-card flex gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                <Icon className="size-5 text-primary" strokeWidth={1.8} aria-hidden />
              </span>
              <div>
                <p className="font-semibold">{t(`landing.feature.${id}.title`)}</p>
                <p className="text-sm text-muted-foreground">{t(`landing.feature.${id}.copy`)}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-[13px] text-muted-foreground">
          <Link to="/privacy" className="underline">
            {t("legal.privacy")}
          </Link>{" "}
          ·{" "}
          <Link to="/terms" className="underline">
            {t("legal.terms")}
          </Link>
        </p>
      </div>
    </main>
  );
}
