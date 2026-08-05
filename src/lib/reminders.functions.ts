/**
 * In-app reminders: upcoming nudges joined with their payment.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listUpcomingReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const { data, error } = await context.supabase
      .from("reminders")
      .select("id, notification_date, enabled, payment:payments(id, title, amount, due_date, status)")
      .eq("enabled", true)
      .gte("notification_date", from.toISOString())
      .order("notification_date", { ascending: true })
      .limit(20);
    // Reminders are a non-critical nudge list: never fail the page for them.
    // (e.g. transient token/clock-skew rejections from the Data API.)
    if (error) {
      console.error("listUpcomingReminders failed:", error.message);
      return [];
    }
    return (data ?? []).filter((row) => row.payment && row.payment.status !== "paid");
  });
