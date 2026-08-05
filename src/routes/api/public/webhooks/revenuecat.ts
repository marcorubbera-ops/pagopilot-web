/**
 * RevenueCat webhook — keeps `profiles.premium` in sync with entitlements.
 *
 * Configure in RevenueCat → Project Settings → Integrations → Webhooks:
 *   URL:            https://<project>.lovable.app/api/public/webhooks/revenuecat
 *   Authorization:  the exact value stored in the REVENUECAT_WEBHOOK_AUTH secret
 *
 * The app user id sent by the SDK is the Supabase user id.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const eventSchema = z.object({
  event: z.object({
    type: z.string(),
    app_user_id: z.string().uuid(),
  }),
});

/** Event types that grant access, and those that revoke it. */
const GRANT = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "SUBSCRIPTION_EXTENDED",
  "TEMPORARY_ENTITLEMENT_GRANT",
]);
const REVOKE = new Set(["EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED", "TRANSFER"]);

export const Route = createFileRoute("/api/public/webhooks/revenuecat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["REVENUECAT_WEBHOOK_AUTH"];
        if (!expected) return new Response("Not configured", { status: 503 });
        if (request.headers.get("authorization") !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const parsed = eventSchema.safeParse(await request.json());
        if (!parsed.success) return new Response("Bad payload", { status: 400 });

        const { type, app_user_id: userId } = parsed.data.event;
        const premium = GRANT.has(type) ? true : REVOKE.has(type) ? false : null;
        // CANCELLATION only stops renewal; access lasts until EXPIRATION.
        if (premium === null) return Response.json({ ok: true, ignored: type });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ premium })
          .eq("id", userId);
        if (error) {
          console.error("revenuecat webhook update failed", error.message);
          return new Response("Update failed", { status: 500 });
        }
        return Response.json({ ok: true, premium });
      },
    },
  },
});
