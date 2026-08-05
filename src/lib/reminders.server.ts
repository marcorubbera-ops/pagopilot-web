/**
 * Server-only reminder helpers. Reminders are simple rows scheduled 7, 3 and 1
 * day before a payment's due date; the app surfaces them in-app.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const REMINDER_OFFSETS = [7, 3, 1] as const;

type Client = SupabaseClient<Database>;

/** Replaces the reminder rows of a payment with a fresh 7/3/1-day schedule. */
export async function syncReminders(
  supabase: Client,
  args: { paymentId: string; userId: string; dueDate: string | null; skip?: boolean },
): Promise<void> {
  await supabase.from("reminders").delete().eq("payment_id", args.paymentId);
  if (!args.dueDate || args.skip) return;

  const due = new Date(`${args.dueDate}T09:00:00Z`);
  const now = Date.now();
  const rows = REMINDER_OFFSETS.map((offset) => {
    const date = new Date(due);
    date.setUTCDate(date.getUTCDate() - offset);
    return {
      payment_id: args.paymentId,
      user_id: args.userId,
      notification_date: date.toISOString(),
      enabled: true,
    };
  }).filter((row) => new Date(row.notification_date).getTime() > now - 86_400_000);

  if (rows.length > 0) await supabase.from("reminders").insert(rows);
}
