/**
 * Profile, premium plan and monthly import quota.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PREMIUM_ENTITLEMENT } from "@/lib/revenuecat-types";

/** Imports allowed per month on the free plan. */
export const FREE_IMPORT_LIMIT = 5;

/** Total documents (image, PDF or receipt) a free-plan account can keep attached at once. */
export const FREE_STORAGE_LIMIT = 10;

/**
 * Ceiling on total bytes stored per account in the shared "documents"
 * bucket, tiered by plan — the project runs on Supabase's free tier
 * (1GB total), so both numbers exist to keep any single account from
 * running up that budget, not as a marketing figure.
 */
export const FREE_STORAGE_BYTES = 50 * 1024 * 1024;
export const PREMIUM_STORAGE_BYTES = 300 * 1024 * 1024;

/** Premium status + this month's import usage, shared by every call site that needs to enforce the free-tier limit. */
export async function getImportQuota(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ premium: boolean; importsUsed: number; importsLeft: number | null }> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("premium")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { count, error: countError } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .or("image_url.not.is.null,pdf_url.not.is.null")
    .gte("created_at", start.toISOString());
  if (countError) throw new Error(countError.message);

  const premium = profile?.premium ?? false;
  const used = count ?? 0;
  return {
    premium,
    importsUsed: used,
    importsLeft: premium ? null : Math.max(0, FREE_IMPORT_LIMIT - used),
  };
}

/**
 * Premium status + total (not monthly) attached-document count, for the
 * "unlimited archive" benefit — separate from the monthly import quota,
 * which limits new OCR extractions, not how many documents you keep.
 */
export async function getStorageQuota(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ premium: boolean; storageUsed: number; storageLeft: number | null }> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("premium")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const { count, error: countError } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .or("image_url.not.is.null,pdf_url.not.is.null,receipt_url.not.is.null");
  if (countError) throw new Error(countError.message);

  const premium = profile?.premium ?? false;
  const used = count ?? 0;
  return {
    premium,
    storageUsed: used,
    storageLeft: premium ? null : Math.max(0, FREE_STORAGE_LIMIT - used),
  };
}

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, email, premium, created_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const quota = await getImportQuota(context.supabase, context.userId);
    const storage = await getStorageQuota(context.supabase, context.userId);
    return {
      profile: data,
      premium: quota.premium,
      importsUsed: quota.importsUsed,
      importLimit: quota.premium ? null : FREE_IMPORT_LIMIT,
      importsLeft: quota.importsLeft,
      storageUsed: storage.storageUsed,
      storageLimit: storage.premium ? null : FREE_STORAGE_LIMIT,
      storageLeft: storage.storageLeft,
    };
  });

/** Looks up the user's active "premium" entitlement directly from RevenueCat's server API. */
async function hasActiveRevenueCatEntitlement(userId: string): Promise<boolean> {
  const secretKey = process.env["REVENUECAT_SECRET_API_KEY"];
  if (!secretKey) throw new Error("RevenueCat is not configured on the server.");

  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );
  if (!response.ok) throw new Error(`RevenueCat lookup failed (${response.status}).`);

  const body = (await response.json()) as {
    subscriber?: { entitlements?: Record<string, { expires_date: string | null }> };
  };
  const entitlement = body.subscriber?.entitlements?.[PREMIUM_ENTITLEMENT];
  if (!entitlement) return false;
  return !entitlement.expires_date || new Date(entitlement.expires_date).getTime() > Date.now();
}

/**
 * Grants Premium after verifying the entitlement directly with RevenueCat's
 * server API — never trusts a client-supplied flag, since that's the only
 * thing standing between a purchase and free access. Used right after a
 * purchase completes and by "restore purchases".
 */
export const syncPremiumFromRevenueCat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const premium = await hasActiveRevenueCatEntitlement(context.userId);
    const { data: updated, error } = await context.supabase
      .from("profiles")
      .update({ premium })
      .eq("id", context.userId)
      .select("id, premium")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

/** Turns Premium off for the current user. Safe to trust client-side: it can only reduce access, never grant it. */
export const deactivatePremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: updated, error } = await context.supabase
      .from("profiles")
      .update({ premium: false })
      .eq("id", context.userId)
      .select("id, premium")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });
