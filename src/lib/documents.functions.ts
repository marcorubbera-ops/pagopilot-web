/**
 * Document import: OCR-style extraction of payment details from an uploaded
 * bill, PagoPA notice, F24 or receipt using the Gemini API.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const extractInput = z.object({
  /** Base64 data URL of an image (JPEG/PNG/WebP) or a PDF. */
  dataUrl: z.string().min(32).max(14_000_000),
  /** Original file name. */
  filename: z.string().max(200).default("document"),
  lang: z.enum(["it", "en"]).default("it"),
});

const extracted = z.object({
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

export type ExtractedPayment = z.infer<typeof extracted>;

const PROMPT = `You read Italian payment documents (utility bills, PagoPA notices "avviso di pagamento", F24 forms, receipts, invoices).

Extract the payment details and reply with ONLY a JSON object, no markdown, with these keys:

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

- title = short human-readable title
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

- notice_number = Codice Avviso (digits only)
- tax_code = creditor tax code
- iban = IBAN if present
- description = one short sentence

Use null whenever you are unsure.

Return ONLY JSON.`;

export const extractPaymentFromDocument = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => extractInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["GEMINI_API_KEY"];
    console.log("GEMINI_API_KEY =", process.env["GEMINI_API_KEY"]);

    console.log("========== DOCUMENT EXTRACTION ==========");
    console.log("Gemini key exists:", !!apiKey);
    console.log("Filename:", data.filename);
    console.log("Is PDF:", data.dataUrl.startsWith("data:application/pdf"));
    console.log("========================================");

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found");
    }

    const isPdf = data.dataUrl.startsWith("data:application/pdf");

    const documentBlock = isPdf
      ? {
          type: "file",
          file: {
            filename: data.filename,
            file_data: data.dataUrl,
          },
        }
      : {
          type: "image_url",
          image_url: {
            url: data.dataUrl,
          },
        };

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: PROMPT,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      data.lang === "it"
                        ? "Estrai i dati di pagamento da questo documento."
                        : "Extract the payment details from this document.",
                  },
                  documentBlock,
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const detail = await response.text();

        console.error("");
        console.error("========== GEMINI ERROR ==========");
        console.error("HTTP Status:", response.status);
        console.error(detail);
        console.error("==================================");
        console.error("");

        throw new Error(detail);
      }

      const payload = (await response.json()) as {
        choices?: {
          message?: {
            content?: string;
          };
        }[];
      };

      console.log("========== GEMINI RESPONSE ==========");
      console.log(JSON.stringify(payload, null, 2));
      console.log("=====================================");

      const raw = payload.choices?.[0]?.message?.content ?? "";

      const json = raw.slice(
        raw.indexOf("{"),
        raw.lastIndexOf("}") + 1
      );

      if (!json) {
        throw new Error("Gemini returned no JSON");
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(json);
      } catch (err) {
        console.error("JSON parse failed");
        console.error(raw);
        throw err;
      }

      const result = extracted.safeParse(parsed);

      if (!result.success) {
        console.error(result.error);
        throw new Error("JSON validation failed");
      }

      return result.data;
    } catch (err) {
      console.error("");
      console.error("========== SERVER ERROR ==========");
      console.error(err);
      console.error("==================================");
      console.error("");

      throw err;
    }
  });