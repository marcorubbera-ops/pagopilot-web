import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ListSection, PaymentRow } from "@/components/PaymentRow";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { listPayments } from "@/lib/payments.functions";
import { effectiveStatus, formatAmount, type Payment } from "@/lib/payments";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendario scadenze — PagoPilot" },
      {
        name: "description",
        content: "Tutte le scadenze del mese in una vista calendario chiara.",
      },
      { property: "og:title", content: "Calendario scadenze — PagoPilot" },
      { property: "og:description", content: "Vedi quando scadono i tuoi pagamenti." },
    ],
  }),
  component: CalendarPage,
});

const toKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function CalendarPage() {
  const { t, lang, locale } = useI18n();
  const fetchPayments = useServerFn(listPayments);
  const { data: payments } = useQuery({ queryKey: ["payments"], queryFn: () => fetchPayments() });

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toKey(today));

  const byDay = useMemo(() => {
    const map = new Map<string, Payment[]>();
    for (const payment of payments ?? []) {
      if (!payment.due_date) continue;
      const list = map.get(payment.due_date) ?? [];
      list.push(payment);
      map.set(payment.due_date, list);
    }
    return map;
  }, [payments]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const monthTotal = (payments ?? []).reduce((sum, payment) => {
    if (!payment.due_date) return sum;
    const date = new Date(`${payment.due_date}T00:00:00`);
    return date.getFullYear() === year && date.getMonth() === month ? sum + Number(payment.amount) : sum;
  }, 0);

  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" })
      .format(new Date(2024, 0, index + 1))
      .slice(0, 2),
  );

  const selectedPayments = byDay.get(selected) ?? [];

  return (
    <AppShell
      title={t("calendar.title")}
      subtitle={new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(cursor)}
    >
      <div className="ios-card mb-5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("calendar.prev")}
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
          <div className="text-center">
            <p className="text-[13px] text-muted-foreground">{t("calendar.monthTotal")}</p>
            <p className="text-lg font-semibold tabular-nums">{formatAmount(monthTotal, lang)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("calendar.next")}
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="size-5" aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map((day, index) => (
            <div key={index} className="pb-1 text-[11px] uppercase text-muted-foreground">
              {day}
            </div>
          ))}
          {cells.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} />;
            const key = toKey(new Date(year, month, day));
            const dayPayments = byDay.get(key) ?? [];
            const isToday = key === toKey(today);
            const isSelected = key === selected;
            const hasOverdue = dayPayments.some((payment) => effectiveStatus(payment) === "expired");
            const allPaid =
              dayPayments.length > 0 && dayPayments.every((payment) => effectiveStatus(payment) === "paid");
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-[15px] tabular-nums transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-primary/12 font-semibold text-primary"
                      : "hover:bg-muted"
                }`}
              >
                {day}
                {dayPayments.length > 0 ? (
                  <span
                    className={`mt-0.5 size-1.5 rounded-full ${
                      isSelected
                        ? "bg-primary-foreground"
                        : allPaid
                          ? "bg-success"
                          : hasOverdue
                            ? "bg-destructive"
                            : "bg-warning"
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPayments.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">{t("calendar.none")}</p>
      ) : (
        <ListSection
          title={t("calendar.selected", {
            date: new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(
              new Date(`${selected}T00:00:00`),
            ),
          })}
        >
          {selectedPayments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </ListSection>
      )}
    </AppShell>
  );
}
