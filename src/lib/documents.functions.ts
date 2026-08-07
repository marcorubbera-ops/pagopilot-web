/**
 * Document import: OCR-style extraction of payment details from an uploaded
 * bill, PagoPA notice, F24 or receipt using the Gemini API.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { extractPaymentWithGemini } from "@/lib/ai/gemini";

const extractInput = z.object({
  /** Base64 data URL of an image (JPEG/PNG/WebP) or a PDF. */
  dataUrl: z.string().min(32).max(14_000_000),
  /** Original file name. */
  filename: z.string().max(200).default("document"),
  lang: z.enum(["it", "en"]).default("it"),
});

const extractedItem = z.object({
  title: z.string().nullable().optional(),
  entity: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  due_date: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  notice_number: z.string().nullable().optional(),
  tax_code: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

const extracted = z.array(extractedItem).min(1);

export type ExtractedPayment = z.infer<typeof extractedItem>;

const PROMPT = `You read Italian payment documents (utility bills, PagoPA notices "avviso di pagamento", F24 forms, receipts, invoices). A document may contain ONE payment, or MULTIPLE distinct payments — e.g. several installments ("rate") of a payment plan, each with its own due date and amount.

Reply with ONLY a JSON array, no markdown — even when there is just a single payment, wrap it in a one-item array. Each array item has these keys:

title
entity
amount
due_date
category
notice_number
tax_code
iban
description

Rules:

- One array item per distinct due date + amount combination.
- title = short human-readable title; include the installment number if present (e.g. "Rata 2/10 Agenzia Entrate")
- entity = company/public body
- amount = number only (17.20)
- due_date = YYYY-MM-DD
- category = one of:
home,
utilities,
government,
taxes,
education,
healthcare,
transport,
insurance,
shopping,
subscriptions,
business,
other

- notice_number = the payment-specific code for that installment (e.g. Codice Avviso, Codice modulo di pagamento), digits only
- tax_code = creditor tax code
- iban = IBAN if present
- description = one short sentence

Use null whenever you are unsure.

Return ONLY the JSON array.`;

export const extractPaymentFromDocument = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => extractInput.parse(input))
  .handler(async ({ data }) => {
    console.log("========== DOCUMENT EXTRACTION ==========");
    console.log("Filename:", data.filename);
    console.log("Is PDF:", data.dataUrl.startsWith("data:application/pdf"));
    console.log("========================================");

    const userPrompt =
      data.lang === "it"
        ? "Estrai tutti i pagamenti da questo documento."
        : "Extract all the payments from this document.";

    let parsed: unknown;

    try {
      parsed = await extractPaymentWithGemini({
        dataUrl: data.dataUrl,
        filename: data.filename,
        systemPrompt: PROMPT,
        userPrompt,
      });
    } catch (err) {
      console.error("");
      console.error("========== SERVER ERROR ==========");
      console.error(err);
      console.error("==================================");
      console.error("");

      throw err;
    }

    const result = extracted.safeParse(parsed);

    if (!result.success) {
      console.error(result.error);
      throw new Error("JSON validation failed");
    }

    return result.data;
  });
