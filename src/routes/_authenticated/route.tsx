// Integration-managed style auth gate: everything under /_authenticated
// requires a signed-in user. ssr:false because the session lives in localStorage.
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLock } from "@/components/AppLock";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <AppLock>
      <Outlet />
    </AppLock>
  ),
});
