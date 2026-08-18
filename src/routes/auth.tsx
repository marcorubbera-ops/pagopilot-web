import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { authErrorMessage } from "@/lib/auth-errors";
import { LanguageSwitcher } from "@/components/AppShell";

const GOOGLE_AUTH_CALLBACK_URL = "com.pagopilot.app://auth-callback";

/**
 * Google blocks sign-in inside embedded WebViews, so on native the OAuth
 * flow has to happen in a Custom Tab, which can't hand a session back to the
 * app WebView directly — it needs a deep link. Supabase's default (implicit)
 * flow puts the session tokens in the redirect URL's fragment.
 */
async function completeNativeOAuth(url: string) {
  if (!url.startsWith(GOOGLE_AUTH_CALLBACK_URL)) return;
  const hash = url.split("#")[1];
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
  }
  await Browser.close().catch(() => {});
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Accedi — PagoPilot" },
      {
        name: "description",
        content: "Accedi a PagoPilot per organizzare bollette, avvisi e documenti di pagamento.",
      },
      { property: "og:title", content: "Accedi — PagoPilot" },
      { property: "og:description", content: "Il tuo archivio di pagamenti, sempre con te." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void router.navigate({ to: "/home" });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void router.navigate({ to: "/home" });
    });

    let urlListener: { remove: () => void } | undefined;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        void completeNativeOAuth(url);
      }).then((handle) => {
        urlListener = handle;
      });
    }

    return () => {
      sub.subscription.unsubscribe();
      urlListener?.remove();
    };
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { lang } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success(t("auth.confirm"));
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(authErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) {
      toast.error(t("auth.forgotPassword.needEmail"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(t("auth.forgotPassword.sent"));
    } catch (error) {
      toast.error(authErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  };

const google = async () => {
  if (Capacitor.isNativePlatform()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: GOOGLE_AUTH_CALLBACK_URL, skipBrowserRedirect: true },
    });
    if (error) {
      toast.error(authErrorMessage(error, t));
      return;
    }
    if (data.url) await Browser.open({ url: data.url });
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    toast.error(authErrorMessage(error, t));
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
            <ShieldCheck className="size-7 text-primary" strokeWidth={1.8} aria-hidden />
          </div>
          <h1 className="large-title">PagoPilot</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("app.tagline")}</p>
        </div>

        <form onSubmit={submit} className="ios-card space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[13px] text-muted-foreground">
              {t("auth.email")}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px] text-muted-foreground">
              {t("auth.password")}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {mode === "signin" ? (
              <button
                type="button"
                className="text-[13px] font-medium text-primary"
                onClick={() => void forgotPassword()}
              >
                {t("auth.forgotPassword")}
              </button>
            ) : null}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? t("auth.wait") : mode === "signin" ? t("auth.signin") : t("auth.signup")}
          </Button>
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={google}>
            {t("auth.google")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? t("auth.toSignup") : t("auth.toSignin")}{" "}
          <button
            type="button"
            className="font-semibold text-primary"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? t("auth.signup") : t("auth.signin")}
          </button>
        </p>
      </div>
    </div>
  );
}
