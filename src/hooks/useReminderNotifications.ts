import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUpcomingReminders } from "@/lib/reminders.functions";
import { localNotificationsSupported, syncLocalNotifications } from "@/lib/reminders/notifications";

/**
 * Keeps on-device local notifications in sync with the signed-in user's
 * upcoming reminders. No-op on web; mount once near the app root so it
 * covers every authenticated screen, not just Home.
 */
export function useReminderNotifications(): void {
  const fetchReminders = useServerFn(listUpcomingReminders);
  const supported = localNotificationsSupported();

  const { data: reminders } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => fetchReminders(),
    enabled: supported,
  });

  useEffect(() => {
    if (!supported || !reminders) return;
    void syncLocalNotifications(reminders);
  }, [supported, reminders]);
}
