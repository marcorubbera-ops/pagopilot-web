/**
 * Server functions for the payment archive. All reads/writes go through the
 * authenticated Supabase client so RLS scopes rows to the signed-in user.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripUndefined } from "@/lib/payments";
import { getImportQuota, getStorageQuota } from "@/lib/profile.functions";

const paymentInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  entity: z.string().trim().max(120).optional().nullable(),
  amount: z.number().min(0).max(9_999_999),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  category: z.string().trim().min(1).default("other"),
  notice_number: z.string().trim().max(60).optional().nullable(),
  tax_code: z.string().trim().max(40).optional().nullable(),
  iban: z.string().trim().max(40).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
  qr_payload: z.string().trim().max(1000).optional().nullable(),
});

export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payments")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const getPayment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: payment, error } = await context.supabase
      .from("payments")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return payment;
  });

export const createPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => paymentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: created, error } = await context.supabase
      .from("payments")
      .insert(stripUndefined({ ...data, user_id: context.userId }))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    const { syncReminders } = await import("@/lib/reminders.server");
    await syncReminders(context.supabase, {
      paymentId: created.id,
      userId: context.userId,
      dueDate: created.due_date,
    });
    return created;
  });

export const updatePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), patch: paymentInput.partial() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("payments")
      .update(stripUndefined(data.patch))
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    const { syncReminders } = await import("@/lib/reminders.server");
    await syncReminders(context.supabase, {
      paymentId: updated.id,
      userId: context.userId,
      dueDate: updated.due_date,
      skip: updated.status === "paid" || updated.status === "archived",
    });
    return updated;
  });

export const setPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "pending",
          "due_today",
          "upcoming",
          "paid",
          "expired",
          "archived",
          "cancelled",
        ]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("payments")
      .update({
        status: data.status,
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    const { syncReminders } = await import("@/lib/reminders.server");
    await syncReminders(context.supabase, {
      paymentId: updated.id,
      userId: context.userId,
      dueDate: updated.due_date,
      skip: data.status !== "pending",
    });
    return updated;
  });

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Links an uploaded storage object (image, PDF or receipt) to a payment. */
export const attachDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        path: z.string().min(1).max(300),
        kind: z.enum(["image", "pdf", "receipt"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.kind === "image" || data.kind === "pdf") {
      const quota = await getImportQuota(context.supabase, context.userId);
      if (quota.importsLeft !== null && quota.importsLeft <= 0) {
        throw new Error("Free import limit reached for this month.");
      }
    }

    // Trust nothing the client claims to have uploaded — confirm the object
    // actually landed in storage before linking a payment to it.
    const lastSlash = data.path.lastIndexOf("/");
    const folder = lastSlash === -1 ? "" : data.path.slice(0, lastSlash);
    const filename = data.path.slice(lastSlash + 1);
    const { data: listing, error: listError } = await context.supabase.storage
      .from("documents")
      .list(folder, { search: filename });
    if (listError || !listing?.some((file) => file.name === filename)) {
      throw new Error("Upload not found. Please try attaching the document again.");
    }

    // Only a payment with no attachment yet adds to the archive count —
    // replacing an existing attachment shouldn't be blocked by the limit.
    const { data: existing, error: existingError } = await context.supabase
      .from("payments")
      .select("image_url, pdf_url, receipt_url")
      .eq("id", data.id)
      .single();
    if (existingError) throw new Error("Payment not found.");
    const alreadyInArchive = Boolean(
      existing.image_url ?? existing.pdf_url ?? existing.receipt_url,
    );
    if (!alreadyInArchive) {
      const storage = await getStorageQuota(context.supabase, context.userId);
      if (storage.storageLeft !== null && storage.storageLeft <= 0) {
        throw new Error("Free storage limit reached. Upgrade to Premium for unlimited storage.");
      }
    }

    const patch =
      data.kind === "image"
        ? { image_url: data.path }
        : data.kind === "pdf"
          ? { pdf_url: data.path }
          : { receipt_url: data.path };
    const { data: updated, error } = await context.supabase
      .from("payments")
      .update(patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });
