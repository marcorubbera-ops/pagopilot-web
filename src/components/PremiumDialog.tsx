import { useState } from "react";
import {
  Archive,
  BadgeEuro,
  Check,
  CloudUpload,
  FileDown,
  ScanFace,
  Receipt,
  ShieldOff,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { setPremium } from "@/lib/profile.functions";
import {
  fetchCustomerInfo,
  fetchPlans,
  hasPremium,
  purchasePlan,
  revenueCatConfigured,
  type PlanId,
} from "@/lib/revenuecat";

type Plan = PlanId;

/** Paywall sheet, Apple-style. Activation is simulated — no store billing on the web build. */
export function PremiumDialog({
  open,
  onOpenChange,
  premium,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  premium: boolean;
  reason?: string;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const upgrade = useServerFn(setPremium);
  const [plan, setPlan] = useState<Plan>("yearly");
  const billingLive = revenueCatConfigured();

  const { data: remotePlans } = useQuery({
    queryKey: ["revenuecat-plans", user?.id],
    queryFn: () => fetchPlans(user!.id),
    enabled: billingLive && open && Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (next: boolean) => upgrade({ data: { premium: next } }),
    onSuccess: (_result, next) => {
      toast.success(next ? t("premium.activated") : t("premium.deactivated"));
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const purchase = useMutation({
    mutationFn: async (id: Plan) => {
      const target = remotePlans?.find((option) => option.id === id);
      if (!target) throw new Error(t("premium.rc.unavailable"));
      const info = await purchasePlan(user!.id, target.pkg, user?.email ?? undefined);
      if (!hasPremium(info)) throw new Error(t("premium.rc.unavailable"));
      return upgrade({ data: { premium: true } });
    },
    onSuccess: () => {
      toast.success(t("premium.activated"));
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const restore = useMutation({
    mutationFn: async () => {
      if (!billingLive || !user?.id) return false;
      const info = await fetchCustomerInfo(user.id);
      const active = hasPremium(info);
      await upgrade({ data: { premium: active } });
      return active;
    },
    onSuccess: (active) => {
      if (!billingLive) {
        toast.info(t("premium.restored"));
        return;
      }
      toast[active ? "success" : "info"](
        active ? t("premium.activated") : t("premium.restored"),
      );
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const benefits = [
    { icon: Archive, label: t("premium.benefit.archive") },
    { icon: CloudUpload, label: t("premium.benefit.sync") },
    { icon: Receipt, label: t("premium.benefit.receipts") },
    { icon: ScanFace, label: t("premium.benefit.faceid") },
    { icon: FileDown, label: t("premium.benefit.pdf") },
    { icon: ShieldOff, label: t("premium.benefit.noads") },
  ];

  const fallbackPlans: { id: Plan; name: string; price: string; badge?: string }[] = [
    { id: "monthly", name: t("premium.plan.monthly"), price: t("premium.plan.monthlyPrice") },
    {
      id: "yearly",
      name: t("premium.plan.yearly"),
      price: t("premium.plan.yearlyPrice"),
      badge: t("premium.plan.badge"),
    },
    {
      id: "lifetime",
      name: t("premium.plan.lifetime"),
      price: t("premium.plan.lifetimePrice"),
      badge: t("premium.plan.lifetimeBadge"),
    },
  ];

  // Live prices from RevenueCat win over the hardcoded ones when available.
  const plans = fallbackPlans
    .filter((option) => !remotePlans || remotePlans.some((remote) => remote.id === option.id))
    .map((option) => {
      const remote = remotePlans?.find((item) => item.id === option.id);
      return remote ? { ...option, price: remote.price } : option;
    });

  const selected = plans.find((option) => option.id === plan) ?? plans[0]!;
  const busy = mutation.isPending || purchase.isPending || restore.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-y-auto rounded-3xl p-6 sm:max-w-md"
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-primary/12">
          <BadgeEuro className="size-7 text-primary" strokeWidth={1.8} aria-hidden />
        </div>
        <DialogTitle className="text-center text-[26px] font-bold leading-tight tracking-[-0.02em]">
          {t("premium.headline")}
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-center text-[15px]">
          {reason ?? t("premium.subtitle")}
        </DialogDescription>

        <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2.5">
          {benefits.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[14px]">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/12">
                <Icon className="size-3.5 text-success" strokeWidth={2} aria-hidden />
              </span>
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2.5">
          {plans.map((option) => {
            const active = option.id === plan;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPlan(option.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-colors",
                  active ? "border-primary bg-primary/6" : "border-border bg-card",
                )}
              >
                <span>
                  <span className="block text-[15px] font-semibold">{option.name}</span>
                  <span className="block text-[13px] text-muted-foreground">{option.price}</span>
                </span>
                <span className="flex items-center gap-2">
                  {option.badge ? (
                    <span className="rounded-full bg-success/14 px-2 py-0.5 text-[11px] font-semibold text-success">
                      {option.badge}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border-2",
                      active ? "border-primary bg-primary" : "border-border",
                    )}
                  >
                    {active ? (
                      <Check className="size-3 text-primary-foreground" strokeWidth={3} aria-hidden />
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-[12px] text-muted-foreground">
          {selected.id === "lifetime"
            ? t("premium.trialLifetime", { price: selected.price })
            : t("premium.trial", { price: selected.price })}
        </p>

        <div className="mt-4 space-y-1">
          <Button
            className="w-full"
            size="lg"
            variant={premium ? "secondary" : "default"}
            disabled={busy}
            onClick={() => {
              if (billingLive && !premium) {
                purchase.mutate(plan);
                return;
              }
              mutation.mutate(!premium);
            }}
          >
            {premium ? t("premium.manage") : t("premium.continue")}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-[14px]"
            disabled={busy}
            onClick={() => restore.mutate()}
          >
            {t("premium.restore")}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-[14px] text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            {t("premium.later")}
          </Button>
        </div>

        {billingLive ? null : (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("premium.demo")}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Convenience hook for screens that need to open the paywall. */
export function usePremiumDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
