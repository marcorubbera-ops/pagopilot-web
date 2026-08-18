import { GoogleGenAI } from "@google/genai";

const apiKey = process.env["GEMINI_API_KEY"];

if (!apiKey) {
  throw new Error("GEMINI_API_KEY not configured");
}

export const gemini = new GoogleGenAI({
  apiKey,
});

const MODEL = "gemini-flash-latest";

export interface ExtractPaymentWithGeminiInput {
  /** Base64 data URL of an image (JPEG/PNG/WebP) or a PDF. */
  dataUrl: string;
  /** Original file name, used only for logging/diagnostics. */
  filename: string;
  /** System instruction describing the extraction task and output shape. */
  systemPrompt: string;
  /** Short user-facing instruction, e.g. "Extract the payment details from this document." */
  userPrompt: string;
}

/**
 * Splits a `data:<mime>;base64,<data>` URL into its parts. Throws if the
 * string is not a base64 data URL.
 */
function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);

  if (!match) {
    throw new Error("Invalid data URL: expected a base64-encoded data: URL");
  }

  const mimeType = match[1];
  const data = match[2];

  if (!mimeType || !data) {
    throw new Error("Invalid data URL: expected a base64-encoded data: URL");
  }

  return { mimeType, data };
}

/**
 * Pulls the first top-level JSON object out of a raw model response (in case
 * the model wraps it in markdown fences or extra text) and parses it.
 */
function extractJson(raw: string): unknown {
  const objStart = raw.indexOf("{");
  const arrStart = raw.indexOf("[");

  let start = -1;
  let close = "";
  if (arrStart !== -1 && (objStart === -1 || arrStart < objStart)) {
    start = arrStart;
    close = "]";
  } else if (objStart !== -1) {
    start = objStart;
    close = "}";
  }

  const end = start === -1 ? -1 : raw.lastIndexOf(close);

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Gemini returned no JSON");
  }

  const json = raw.slice(start, end + 1);

  try {
    return JSON.parse(json);
  } catch (err) {
    console.error("========== GEMINI JSON PARSE FAILED ==========");
    console.error(raw);
    console.error("===============================================");
    throw err;
  }
}

/**
 * Sends a document (image or PDF, as a base64 data URL) plus a prompt to
 * Gemini using the official @google/genai SDK and returns the parsed JSON
 * response.
 *
 * This function is intentionally schema-agnostic: it does not know about
 * payments, categories, etc. Callers are responsible for validating the
 * shape of the returned value (e.g. with Zod).
 */
/** Gemini's own transient-overload/rate-limit statuses — worth one retry, unlike a bad prompt or malformed input. */
function isTransientStatus(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  return status === 429 || status === 500 || status === 503 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function extractPaymentWithGemini(
  input: ExtractPaymentWithGeminiInput,
): Promise<unknown> {
  const { mimeType, data } = parseDataUrl(input.dataUrl);

  console.log("========== GEMINI EXTRACTION ==========");
  console.log("Filename:", input.filename);
  console.log("Mime type:", mimeType);
  console.log("========================================");

  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data,
                },
              },
              {
                text: input.userPrompt,
              },
            ],
          },
        ],
        config: {
          systemInstruction: input.systemPrompt,
          responseMimeType: "application/json",
          temperature: 0,
        },
      });

      const raw = response.text ?? "";

      console.log("========== GEMINI RESPONSE ==========");
      console.log(raw);
      console.log("=====================================");

      return extractJson(raw);
    } catch (err) {
      console.error("");
      console.error(`========== GEMINI ERROR (attempt ${attempt}/${attempts}) ==========`);
      console.error(err);
      console.error("===================================");
      console.error("");

      if (attempt === attempts || !isTransientStatus(err)) throw err;
      await sleep(attempt * 1000);
    }
  }

  throw new Error("unreachable");
}
