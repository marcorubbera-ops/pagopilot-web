import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChartPie,
  FileText,
  House,
  Languages,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, useI18n } from "@/lib/i18n";

/**
 * iOS-style app chrome: frosted large-title nav bar plus a bottom tab bar.
 */
export function AppShell({
  title,
  trailing,
  children,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="glass sticky top-0 z-20 border-b border-border/60 px-5 pb-3 pt-6">
        <div className="mx-auto grid max-w-xl grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <Link
              to="/home"
              aria-label={t("app.name")}
              className="shrink-0"
            >
              <img
                src="/favicon.png"
                alt="PagoPilot"
                width={36}
                height={36}
                className="mt-1 size-9 rounded-[10px]"
              />
            </Link>

            <div className="min-w-0">
              <h1 className="large-title truncate">{title}</h1>

              {subtitle ? (
                <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher />
            {trailing}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-5">
        {children}
      </main>

      <TabBar />
    </div>
  );
}

/** Italian/English picker, available from every screen's nav bar. */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  const current =
    LANGUAGES.find((item) => item.id === lang) ?? LANGUAGES[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("lang.switch")}
          className="gap-1.5"
        >
          <Languages className="size-4" aria-hidden />
          {current.short}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {LANGUAGES.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onSelect={() => setLang(item.id)}
            className={item.id === lang ? "font-semibold text-primary" : ""}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TabBar() {
  const { t } = useI18n();

  const tabs = [
    { to: "/home", label: t("nav.home"), icon: House },
    { to: "/documents", label: t("nav.documents"), icon: FileText },
    { to: "/calendar", label: t("nav.calendar"), icon: CalendarDays },
    { to: "/stats", label: t("nav.stats"), icon: ChartPie },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ] as const;

  return (
    <nav
      aria-label={t("nav.main")}
      className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-xl">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition active:scale-90"
              activeProps={{ className: "text-primary" }}
            >
              <Icon
                className="size-[22px]"
                strokeWidth={1.8}
                aria-hidden
              />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}