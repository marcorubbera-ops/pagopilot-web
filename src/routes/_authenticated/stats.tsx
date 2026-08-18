import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Download } from "lucide-react";
import * as RechartsPrimitive from "recharts";
import { AppShell } from "@/components/AppShell";
import { ExportMenu } from "@/components/ExportMenu";
import { PremiumDialog } from "@/components/PremiumDialog";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useI18n } from "@/lib/i18n";
import { listPayments } from "@/lib/payments.functions";
import { getProfile } from "@/lib/profile.functions";
import { CATEGORY_IDS, categoryLabel, effectiveStatus, formatAmount } from "@/lib/payments";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({
    meta: [
      { title: "Statistiche pagamenti — PagoPilot" },
      {
        name: "description",
        content: "Quanto spendi, per categoria e per mese, con export dei dati.",
      },
      { property: "og:title", content: "Statistiche pagamenti — PagoPilot" },
      { property: "og:description", content: "Analizza le tue spese ricorrenti." },
    ],
  }),
  component: StatsPage,
});

type Range = "month" | "year" | "all";

function StatsPage() {
  const { t, lang, locale } = useI18n();
  const fetchPayments = useServerFn(listPayments);
  const fetchProfile = useServerFn(getProfile);
  const [range, setRange] = useState<Range>("year");
  const [paywall, setPaywall] = useState(false);

  const { data: payments } = useQuery({ queryKey: ["payments"], queryFn: () => fetchPayments() });
  const { data: account } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const premium = account?.premium ?? false;

  const rows = useMemo(() => {
    const all = payments ?? [];
    if (range === "all") return all;
    const now = new Date();
    return all.filter((payment) => {
      const reference = payment.due_date ?? payment.created_at.slice(0, 10);
      const date = new Date(`${reference}T00:00:00`);
      if (date.getFullYear() !== now.getFullYear()) return false;
      return range === "year" ? true : date.getMonth() === now.getMonth();
    });
  }, [payments, range]);

  const totals = useMemo(() => {
    let paid = 0;
    let open = 0;
    let onTime = 0;
    let paidCount = 0;
    for (const payment of rows) {
      const amount = Number(payment.amount);
      const status = effectiveStatus(payment);
      if (status === "paid") {
        paid += amount;
        paidCount += 1;
        if (!payment.due_date || !payment.paid_at || payment.paid_at.slice(0, 10) <= payment.due_date) {
          onTime += 1;
        }
      } else if (status !== "cancelled" && status !== "archived") {
        open += amount;
      }
    }
    return {
      paid,
      open,
      count: rows.length,
      avg: rows.length ? (paid + open) / rows.length : 0,
      onTime: paidCount ? Math.round((onTime / paidCount) * 100) : null,
    };
  }, [rows]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const payment of rows) {
      map.set(payment.category, (map.get(payment.category) ?? 0) + Number(payment.amount));
    }
    return [...map.entries()]
      .filter(([id]) => (CATEGORY_IDS as readonly string[]).includes(id) || true)
      .sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const categoryChartData = useMemo(
    () => byCategory.map(([id, total]) => ({ id, total })),
    [byCategory],
  );

  const categoryChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    byCategory.forEach(([id], index) => {
      config[id] = { label: categoryLabel(t, id), color: `var(--color-chart-${(index % 5) + 1})` };
    });
    return config;
  }, [byCategory, t]);

  const byMonth = useMemo(() => {
    const months: { label: string; total: number }[] = [];
    const now = new Date();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const total = (payments ?? []).reduce((sum, payment) => {
        const reference = payment.due_date ?? payment.created_at.slice(0, 10);
        const parsed = new Date(`${reference}T00:00:00`);
        return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth()
          ? sum + Number(payment.amount)
          : sum;
      }, 0);
      months.push({
        label: new Intl.DateTimeFormat(locale, { month: "short" }).format(date),
        total,
      });
    }
    return months;
  }, [payments, locale]);

  const maxCategory = Math.max(...byCategory.map(([, total]) => total), 1);
  const maxMonth = Math.max(...byMonth.map((month) => month.total), 1);

  return (
    <AppShell title={t("stats.title")} subtitle={t("stats.subtitle")}>
      <div className="mb-5 flex gap-2">
        {(["month", "year", "all"] as Range[]).map((option) => (
          <Button
            key={option}
            size="sm"
            variant={range === option ? "default" : "secondary"}
            onClick={() => setRange(option)}
          >
            {t(`stats.${option}` as "stats.year")}
          </Button>
        ))}
      </div>


      {rows.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">{t("stats.empty")}</p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Metric label={t("stats.total")} value={formatAmount(totals.paid, lang)} />
            <Metric label={t("stats.openTotal")} value={formatAmount(totals.open, lang)} />
            <Metric label={t("stats.count")} value={String(totals.count)} />
            <Metric label={t("stats.avg")} value={formatAmount(totals.avg, lang)} />
          </div>

          {totals.onTime !== null ? (
            <div className="ios-card mb-5 p-4">
              <p className="text-[13px] text-muted-foreground">{t("stats.onTime")}</p>
              <p className="text-2xl font-bold tabular-nums">{totals.onTime}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success" style={{ width: `${totals.onTime}%` }} />
              </div>
            </div>
          ) : null}

          {premium ? (
            <>
              <section className="ios-card mb-5 p-4">
                <h2 className="mb-3 text-[15px] font-semibold">{t("stats.byCategory")}</h2>
                <ChartContainer config={categoryChartConfig} className="mx-auto mb-4 aspect-square max-h-64">
                  <RechartsPrimitive.PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value, name) => (
                            <div className="flex w-full items-center justify-between gap-3">
                              <span className="text-muted-foreground">
                                {categoryLabel(t, String(name))}
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatAmount(Number(value), lang)}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <RechartsPrimitive.Pie
                      data={categoryChartData}
                      dataKey="total"
                      nameKey="id"
                      innerRadius={55}
                      outerRadius={90}
                      strokeWidth={2}
                    >
                      {categoryChartData.map((entry) => (
                        // A raw `fill="var(...)"` SVG attribute doesn't reliably
                        // resolve CSS custom properties on Safari/WebKit (renders
                        // solid black) — `style` does, on every engine.
                        <RechartsPrimitive.Cell
                          key={entry.id}
                          style={{ fill: `var(--color-${entry.id})` }}
                        />
                      ))}
                    </RechartsPrimitive.Pie>
                  </RechartsPrimitive.PieChart>
                </ChartContainer>
                <ul className="space-y-3">
                  {byCategory.map(([id, total]) => (
                    <li key={id}>
                      <div className="mb-1 flex justify-between text-[13px]">
                        <span>{categoryLabel(t, id)}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatAmount(total, lang)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(total / maxCategory) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="ios-card mb-5 p-4">
                <h2 className="mb-3 text-[15px] font-semibold">{t("stats.byMonth")}</h2>
                <div className="flex h-32 items-end gap-2">
                  {byMonth.map((month) => (
                    <div key={month.label} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-primary/70"
                        style={{ height: `${Math.max(4, (month.total / maxMonth) * 100)}%` }}
                        title={formatAmount(month.total, lang)}
                      />
                      <span className="text-[11px] text-muted-foreground">{month.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPaywall(true)}
              className="ios-card mb-5 flex w-full items-start gap-3 p-4 text-left"
            >
              <Crown className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
              <span>
                <span className="block font-semibold">{t("stats.premium.title")}</span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground">
                  {t("stats.premium.copy")}
                </span>
              </span>
            </button>
          )}

          <ExportMenu
            payments={rows}
            premium={premium}
            onPaywall={() => setPaywall(true)}
            trigger={
              <Button variant="secondary" className="w-full">
                <Download className="size-4" aria-hidden /> {t("stats.export")}
              </Button>
            }
          />
        </>
      )}

      <PremiumDialog open={paywall} onOpenChange={setPaywall} premium={premium} />
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ios-card p-4">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
