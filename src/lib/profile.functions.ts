/**
 * Profile, premium plan and monthly import quota.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Imports allowed per month on the free plan. */
export const FREE_IMPORT_LIMIT = 5;

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, email, premium, created_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const { count, error: countError } = await context.supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .or("image_url.not.is.null,pdf_url.not.is.null")
      .gte("created_at", start.toISOString());
    if (countError) throw new Error(countError.message);

    const premium = data?.premium ?? false;
    const used = count ?? 0;
    return {
      profile: data,
      premium,
      importsUsed: used,
      importLimit: premium ? null : FREE_IMPORT_LIMIT,
      importsLeft: premium ? null : Math.max(0, FREE_IMPORT_LIMIT - used),
    };
  });

/**
 * Demo premium switch. A real deployment would flip this from a verified
 * store/payment webhook instead of a client call.
 */
export const setPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ premium: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("profiles")
      .update({ premium: data.premium })
      .eq("id", context.userId)
      .select("id, premium")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });
