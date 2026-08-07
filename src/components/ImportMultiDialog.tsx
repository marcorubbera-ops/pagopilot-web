import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n";
import { CATEGORY_IDS, categoryLabel, formatAmount, formatDate } from "@/lib/payments";
import type { ExtractedPayment } from "@/lib/documents.functions";

/**
 * Review list shown when a single document (typically a multi-page PDF)
 * yields more than one distinct payment — e.g. several installments of a
 * payment plan. Lets the user deselect any that shouldn't be imported.
 */
export function ImportMultiDialog({
  open,
  onOpenChange,
  items,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ExtractedPayment[];
  onImport: (selected: ExtractedPayment[]) => Promise<unknown>;
}) {
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setSelected(new Set(items.map((_, index) => index)));
  }, [open, items]);

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const submit = async () => {
    setBusy(true);
    try {
      await onImport(items.filter((_, index) => selected.has(index)));
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(items.length === 1 ? "import.multi.title.one" : "import.multi.title.other", {
              count: items.length,
            })}
          </DialogTitle>
          <DialogDescription>{t("import.multi.description")}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh]">
          <ul className="space-y-2 pr-3">
            {items.map((item, index) => {
              const category =
                item.category && (CATEGORY_IDS as readonly string[]).includes(item.category)
                  ? item.category
                  : "other";
              return (
                <li key={index}>
                  <label className="ios-card flex cursor-pointer items-start gap-3 p-3">
                    <Checkbox
                      checked={selected.has(index)}
                      onCheckedChange={() => toggle(index)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{item.title ?? "—"}</p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {item.entity ? `${item.entity} · ` : ""}
                        {categoryLabel(t, category)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[15px] font-semibold tabular-nums">
                        {formatAmount(item.amount ?? null, lang)}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {formatDate(item.due_date ?? null, lang) || t("due.none")}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={selected.size === 0 || busy}
            onClick={() => void submit()}
          >
            {busy
              ? t("form.saving")
              : t(selected.size === 1 ? "import.multi.import.one" : "import.multi.import.other", {
                  count: selected.size,
                })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
