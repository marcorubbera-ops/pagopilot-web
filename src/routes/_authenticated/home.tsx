import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, CircleAlert, CircleCheck, Clock, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ImportDocumentButton } from "@/components/ImportDocumentButton";
import { ListSection, PaymentRow } from "@/components/PaymentRow";
import { QuickAddDialog } from "@/components/QuickAddDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createPayment, listPayments } from "@/lib/payments.functions";
import { listUpcomingReminders } from "@/lib/reminders.functions";
import { LOCALES, useI18n, type Lang } from "@/lib/i18n";
import {
  effectiveStatus,
  findNextDue,
  formatAmount,
  formatDate,
  type Payment,
  type PaymentFormValues,
} from "@/lib/payments";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Riepilogo — PagoPilot" },
      {
        name: "description",
        content: "Vedi cosa devi pagare, cosa è scaduto e cosa hai già pagato.",
      },
      { property: "og:title", content: "Riepilogo — PagoPilot" },
      { property: "og:description", content: "Scadenze, ritardi e pagamenti in un colpo d'occhio." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const fetchPayments = useServerFn(listPayments);
  const addPayment = useServerFn(createPayment);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t, lang } = useI18n();

  const fetchReminders = useServerFn(listUpcomingReminders);
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => fetchPayments(),
  });
  const { data: reminders } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => fetchReminders(),
  });

  const create = useMutation({
    mutationFn: (values: PaymentFormValues) => addPayment({ data: values }),
    onSuccess: () => {
      toast.success(t("form.saved"));
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = payments ?? [];
  const stats = summarize(rows);
  const months = monthlyTotals(rows, lang);
  const recent = [...rows]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 5);

  const uniqueReminders = dedupeReminders(reminders ?? []);

  return (
    <AppShell
      title="PagoPilot"
      subtitle={t("app.tagline")}
      trailing={
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await supabase.auth.signOut();
            void router.navigate({ to: "/auth" });
          }}
        >
          {t("auth.signout")}
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard icon={Clock} label={t("home.stat.due")} value={String(stats.due)} tone="primary" filter="open" />
        <StatCard icon={CalendarClock} label={t("home.stat.soon")} value={String(stats.soon)} tone="warning" filter="soon" />
        <StatCard icon={CircleAlert} label={t("home.stat.overdue")} value={String(stats.overdue)} tone="danger" filter="expired" />
        <StatCard icon={CircleCheck} label={t("home.stat.paid")} value={String(stats.paid)} tone="success" filter="paid" />
      </div>

      <div className="mb-6 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {months.map((month, index) => (
          <div
            key={month.key}
            className="ios-card flex min-w-[220px] shrink-0 snap-start items-center justify-between p-4"
          >
            <div>
              <p className="text-[13px] capitalize text-muted-foreground">
                {index === 0 ? t("home.thisMonth") : month.label}
              </p>
              <p className="text-2xl font-bold tabular-nums">{formatAmount(month.total, lang)}</p>
              {index === 0 ? (
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {stats.nextDue
                    ? t("home.nextReminder", {
                        title: stats.nextDue.title,
                        date: formatDate(stats.nextDue.due_date, lang) || t("due.none"),
                      })
                    : t("home.noReminders")}
                </p>
              ) : null}
            </div>
            <Wallet className="size-8 shrink-0 text-primary" strokeWidth={1.6} aria-hidden />
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <QuickAddDialog
          onSubmit={(values) => create.mutateAsync(values)}
          trigger={
            <Button className="w-full" size="lg">
              <Plus className="size-4" aria-hidden /> {t("home.quickAdd")}
            </Button>
          }
        />
        <ImportDocumentButton className="w-full" />
      </div>

      {uniqueReminders.length > 0 ? (
        <section className="ios-card mb-6 overflow-hidden">
          <h2 className="border-b border-border/60 px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("reminders.title")}
          </h2>
          <ul className="divide-y divide-border/60">
            {uniqueReminders.slice(0, 3).map((reminder) => {
              const days = Math.round(
                (new Date(reminder.notification_date).setHours(0, 0, 0, 0) -
                  new Date().setHours(0, 0, 0, 0)) /
                  86_400_000,
              );
              const when =
                days <= 0 ? t("reminders.today") : days === 1 ? t("reminders.tomorrow") : t("reminders.days", { days });
              return (
                <li key={reminder.id}>
                  <Link
                    to="/payments/$id"
                    params={{ id: reminder.payment?.id ?? "" }}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 active:bg-muted/60"
                  >
                    <span className="truncate text-[15px]">{reminder.payment?.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
                      {when}
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary">
                        {t("pay.now")}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {isLoading ? (
        <p className="px-1 text-sm text-muted-foreground">{t("home.loading")}</p>
      ) : recent.length === 0 ? (
        <div className="ios-card p-6 text-center">
          <p className="font-semibold">{t("home.empty.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("home.empty.copy")}
          </p>
        </div>
      ) : (
        <ListSection title={t("home.recent")}>
          {recent.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </ListSection>
      )}
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  filter,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone: "primary" | "warning" | "danger" | "success";
  /** Opens the archive already filtered on this bucket. */
  filter: "open" | "soon" | "expired" | "paid";
}) {
  const toneClass = {
    primary: "text-primary",
    warning: "text-warning",
    danger: "text-destructive",
    success: "text-success",
  }[tone];
  return (
    <Link
      to="/documents"
      search={{ filter }}
      className="ios-card block p-4 text-left transition-transform active:scale-[0.98]"
    >
      <Icon className={`size-5 ${toneClass}`} strokeWidth={1.8} aria-hidden />
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[13px] text-muted-foreground">{label}</p>
    </Link>
  );
}

/** Dashboard counters derived from the payment list. */
function summarize(payments: Payment[]) {
  const now = new Date();
  let due = 0;
  let soon = 0;
  let overdue = 0;
  let paid = 0;
  let monthTotal = 0;

  for (const payment of payments) {
    const status = effectiveStatus(payment);
    if (status === "paid") paid += 1;
    if (status === "expired") overdue += 1;
    if (status === "due_today" || status === "upcoming" || status === "pending") due += 1;
    if (status === "upcoming" || status === "due_today") soon += 1;

    if (payment.due_date) {
      const date = new Date(`${payment.due_date}T00:00:00`);
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        monthTotal += Number(payment.amount);
      }
    }
  }

  return { due, soon, overdue, paid, monthTotal, nextDue: findNextDue(payments) };
}

type UpcomingReminders = Awaited<ReturnType<typeof listUpcomingReminders>>;

/** Keeps only the soonest reminder per payment (the list is already sorted by date). */
function dedupeReminders(reminders: UpcomingReminders): UpcomingReminders {
  const seen = new Set<string>();
  const unique: UpcomingReminders = [];
  for (const reminder of reminders) {
    const paymentId = reminder.payment?.id;
    if (!paymentId || seen.has(paymentId)) continue;
    seen.add(paymentId);
    unique.push(reminder);
  }
  return unique;
}

/** Sums payment amounts due in each of the next `count` months, starting this month. */
function monthlyTotals(payments: Payment[], lang: Lang, count = 6) {
  const now = new Date();
  const buckets = Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      year: date.getFullYear(),
      month: date.getMonth(),
      label: new Intl.DateTimeFormat(LOCALES[lang], { month: "long", year: "numeric" }).format(
        date,
      ),
      total: 0,
    };
  });

  for (const payment of payments) {
    if (!payment.due_date) continue;
    const date = new Date(`${payment.due_date}T00:00:00`);
    const bucket = buckets.find(
      (b) => b.year === date.getFullYear() && b.month === date.getMonth(),
    );
    if (bucket) bucket.total += Number(payment.amount);
  }

  return buckets;
}
