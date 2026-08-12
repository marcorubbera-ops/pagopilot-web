import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { CATEGORY_IDS, categoryLabel, type PaymentFormValues } from "@/lib/payments";

export type FormShape = {
  title: string;
  entity: string;
  amount: string;
  due_date: string;
  category: string;
  custom_category: string;
  notice_number: string;
  tax_code: string;
  iban: string;
  notes: string;
  tags: string;
};

/** Manual payment entry form in an iOS-style sheet dialog. */
export function QuickAddDialog({
  trigger,
  onSubmit,
  defaults,
  title,
  description,
  open: openProp,
  onOpenChange,
}: {
  trigger?: ReactNode;
  onSubmit: (values: PaymentFormValues) => Promise<unknown>;
  defaults?: Partial<FormShape>;
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({
    defaultValues: {
      title: "",
      entity: "",
      amount: "",
      due_date: "",
      category: "other",
      custom_category: "",
      notice_number: "",
      tax_code: "",
      iban: "",
      notes: "",
      tags: "",
      ...defaults,
    },
  });

  const serialisedDefaults = JSON.stringify(defaults ?? {});
  useEffect(() => {
    if (!open) return;
    reset({
      title: "",
      entity: "",
      amount: "",
      due_date: "",
      category: "other",
      custom_category: "",
      notice_number: "",
      tax_code: "",
      iban: "",
      notes: "",
      tags: "",
      ...(JSON.parse(serialisedDefaults) as Partial<FormShape>),
    });
  }, [open, serialisedDefaults, reset]);

  const selectedCategory = watch("category");

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title.trim(),
      entity: values.entity.trim() || null,
      amount: Number(values.amount.replace(",", ".")) || 0,
      due_date: values.due_date || null,
      category:
        values.category === "other" && values.custom_category.trim()
          ? values.custom_category.trim()
          : values.category,
      notice_number: values.notice_number.trim() || null,
      tax_code: values.tax_code.trim() || null,
      iban: values.iban.trim() || null,
      notes: values.notes.trim() || null,
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? t("form.title")}</DialogTitle>
          <DialogDescription>{description ?? t("form.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label={t("field.title")} error={errors.title?.message}>
            <Input
              placeholder={t("form.ph.title")}
              {...register("title", { required: t("form.required.title") })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.amount")} error={errors.amount?.message}>
              <Input
                inputMode="decimal"
                placeholder={t("form.ph.amount")}
                {...register("amount", {
                  required: t("form.required.amount"),
                  validate: (value) => {
                    const parsed = Number(value.replace(",", "."));
                    return (Number.isFinite(parsed) && parsed > 0) || t("form.invalid.amount");
                  },
                })}
              />
            </Field>
            <Field label={t("field.dueDate")}>
              <Input type="date" {...register("due_date")} />
            </Field>
          </div>
          <Field label={t("field.entity")}>
            <Input placeholder={t("form.ph.entity")} {...register("entity")} />
          </Field>
          <Field label={t("field.category")}>
            <Select value={selectedCategory} onValueChange={(value) => setValue("category", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_IDS.map((id) => (
                  <SelectItem key={id} value={id}>
                    {categoryLabel(t, id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {selectedCategory === "other" ? (
            <Field label={t("field.customCategory")}>
              <Input
                placeholder={t("form.ph.customCategory")}
                {...register("custom_category")}
              />
            </Field>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("field.noticeNumber")}>
              <Input placeholder="3020 0000 0000 0000 00" {...register("notice_number")} />
            </Field>
            <Field label={t("field.taxCode")}>
              <Input placeholder="80078750587" {...register("tax_code")} />
            </Field>
          </div>
          <Field label={t("field.iban")}>
            <Input placeholder="IT60X0542811101000000123456" {...register("iban")} />
          </Field>
          <Field label={t("field.tags")}>
            <Input placeholder={t("form.ph.tags")} {...register("tags")} />
          </Field>
          <Field label={t("field.notes")}>
            <Textarea rows={3} placeholder={t("form.ph.notes")} {...register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? t("form.saving") : t("form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
    </div>
  );
}
