/**
 * On-device local notifications for upcoming payment reminders. Runs only
 * inside the native Capacitor app — a no-op on web, where reminders stay
 * in-app only.
 */
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { formatAmount } from "@/lib/payments";

const CHANNEL_ID = "pagopilot-reminders";

export interface ReminderNotificationInput {
  id: string;
  notification_date: string;
  payment: { id: string; title: string; amount: number } | null;
}

export function localNotificationsSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/** Deterministic 31-bit id so the same reminder always maps to the same notification. */
function notificationIdFor(reminderId: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < reminderId.length; i++) {
    hash ^= reminderId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash & 0x7fffffff;
}

async function ensurePermission(): Promise<boolean> {
  const status = await LocalNotifications.checkPermissions();
  if (status.display === "granted") return true;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

async function ensureChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return;
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "Promemoria pagamenti",
    description: "Avvisi prima delle scadenze dei pagamenti",
    importance: 4,
  });
}

/**
 * Replaces every on-device reminder notification with the given list. Safe
 * to call repeatedly (e.g. whenever the reminders query refetches) — it
 * cancels everything currently pending under our id scheme first, so paid or
 * deleted payments stop nagging once the caller passes a fresher list.
 */
export async function syncLocalNotifications(
  reminders: ReminderNotificationInput[],
): Promise<void> {
  if (!localNotificationsSupported()) return;

  const granted = await ensurePermission();
  if (!granted) return;

  await ensureChannel();

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((notification) => ({ id: notification.id })),
    });
  }

  const now = Date.now();
  const notifications = reminders
    .filter((reminder) => reminder.payment && new Date(reminder.notification_date).getTime() > now)
    .map((reminder) => ({
      id: notificationIdFor(reminder.id),
      title: "PagoPilot",
      body: `${reminder.payment!.title} — ${formatAmount(reminder.payment!.amount)}`,
      schedule: { at: new Date(reminder.notification_date) },
      channelId: CHANNEL_ID,
      extra: { paymentId: reminder.payment!.id },
    }));

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}
