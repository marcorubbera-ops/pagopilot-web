import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { authErrorMessage } from "@/lib/auth-errors";
import { LanguageSwitcher } from "@/components/AppShell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reimposta password — PagoPilot" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The recovery link's tokens land in the URL hash; supabase-js picks them
    // up automatically and fires this event once the recovery session is set.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("auth.reset.success"));
      void router.navigate({ to: "/home" });
    } catch (error) {
      toast.error(authErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-2 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/12">
            <KeyRound className="size-7 text-primary" strokeWidth={1.8} aria-hidden />
          </div>
          <h1 className="large-title">{t("auth.reset.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.reset.description")}</p>
        </div>

        {ready ? (
          <form onSubmit={submit} className="ios-card space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-[13px] text-muted-foreground">
                {t("auth.reset.newPassword")}
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? t("auth.wait") : t("auth.reset.submit")}
            </Button>
          </form>
        ) : (
          <p className="text-center text-sm text-muted-foreground">{t("auth.reset.invalidLink")}</p>
        )}
      </div>
    </div>
  );
}
