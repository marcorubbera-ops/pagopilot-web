import { GoogleGenAI } from "@google/genai";

const apiKey = process.env["GEMINI_API_KEY"];

if (!apiKey) {
  throw new Error("GEMINI_API_KEY not configured");
}

export const gemini = new GoogleGenAI({
  apiKey,
});

export async function uploadDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string,
) {
  const blob = new Blob([new Uint8Array(buffer)], {
  type: mimeType,
});

  const uploaded = await gemini.files.upload({
    file: blob,
    config: {
      mimeType,
      displayName: filename,
    },
  });

  let file = uploaded;

  while (file.state === "PROCESSING") {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    file = await gemini.files.get({
      name: file.name ?? "",
    });
  }

  if (file.state !== "ACTIVE") {
    throw new Error(`Gemini file failed: ${file.state}`);
  }

  return file;
}

export async function generatePaymentJson(
  uploadedFile: Awaited<ReturnType<typeof uploadDocument>>,
  prompt: string,
) {
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",

    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: uploadedFile.mimeType!,
              fileUri: uploadedFile.uri!,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],

    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  return response.text;
}