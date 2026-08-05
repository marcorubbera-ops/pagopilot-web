import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ListSection, PaymentRow } from "@/components/PaymentRow";
import { QuickAddDialog } from "@/components/QuickAddDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPayment, listPayments } from "@/lib/payments.functions";
import { useI18n, type Translate } from "@/lib/i18n";
import {
  categoryLabel,
  effectiveStatus,
  formatAmount,
  type Payment,
  type PaymentFormValues,
} from "@/lib/payments";

const FILTERS = ["all", "open", "soon", "expired", "paid", "month", "year"] as const;

type FilterId = (typeof FILTERS)[number];

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Documenti — PagoPilot" },
      {
        name: "description",
        content: "Cerca e filtra tutte le bollette, gli avvisi e i documenti di pagamento importati.",
      },
      { property: "og:title", content: "Documenti — PagoPilot" },
      { property: "og:description", content: "Il tuo archivio di pagamenti sempre ricercabile." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    filter: z.enum(FILTERS).catch("all").parse(search["filter"] ?? "all"),
  }),
  component: DocumentsPage,
});


function DocumentsPage() {
  const fetchPayments = useServerFn(listPayments);
  const addPayment = useServerFn(createPayment);
  const queryClient = useQueryClient();
  const { t, lang } = useI18n();
  const [query, setQuery] = useState("");
  const { filter } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setFilter = (next: FilterId) => void navigate({ search: { filter: next } });

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => fetchPayments(),
  });

  const create = useMutation({
    mutationFn: (values: PaymentFormValues) => addPayment({ data: values }),
    onSuccess: () => {
      toast.success(t("form.saved"));
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const results = useMemo(
    () => filterPayments(payments ?? [], query, filter, t),
    [payments, query, filter, t],
  );
  const total = results.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <AppShell
      title={t("docs.title")}
      subtitle={t(results.length === 1 ? "docs.count.one" : "docs.count.other", {
        count: results.length,
        total: formatAmount(total, lang),
      })}
      trailing={
        <QuickAddDialog
          onSubmit={(values) => create.mutateAsync(values)}
          trigger={
            <Button size="icon" aria-label={t("docs.add")}>
              <Plus className="size-5" aria-hidden />
            </Button>
          }
        />
      }
    >
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("docs.search")}
          className="pl-9"
          aria-label={t("docs.title")}
        />
      </div>

      <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              filter === item ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            {t(`docs.filter.${item}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="px-1 text-sm text-muted-foreground">{t("docs.loading")}</p>
      ) : results.length === 0 ? (
        <div className="ios-card p-6 text-center">
          <p className="font-semibold">{t("docs.empty.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("docs.empty.copy")}
          </p>
        </div>
      ) : (
        <ListSection>
          {results.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </ListSection>
      )}
    </AppShell>
  );
}

/** Client-side search across every searchable field, plus status/date filters. */
function filterPayments(
  payments: Payment[],
  query: string,
  filter: FilterId,
  t: Translate,
): Payment[] {
  const needle = query.trim().toLowerCase();
  const now = new Date();

  return payments.filter((payment) => {
    const status = effectiveStatus(payment);
    if (filter === "open" && (status === "paid" || status === "archived" || status === "cancelled")) {
      return false;
    }
    if (filter === "paid" && status !== "paid") return false;
    if (filter === "soon" && status !== "upcoming" && status !== "due_today") return false;
    if (filter === "expired" && status !== "expired") return false;
    if (filter === "month" || filter === "year") {
      if (!payment.due_date) return false;
      const date = new Date(`${payment.due_date}T00:00:00`);
      if (date.getFullYear() !== now.getFullYear()) return false;
      if (filter === "month" && date.getMonth() !== now.getMonth()) return false;
    }
    if (!needle) return true;

    const haystack = [
      payment.title,
      payment.entity,
      categoryLabel(t, payment.category),
      payment.notice_number,
      payment.tax_code,
      payment.iban,
      payment.notes,
      payment.description,
      payment.due_date,
      String(payment.amount),
      ...payment.tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}
