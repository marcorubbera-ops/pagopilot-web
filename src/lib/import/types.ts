export interface ImportResult {
  title: string | null;
  entity: string | null;
  amount: number | null;
  due_date: string | null;
  category: string | null;
  notice_number: string | null;
  tax_code: string | null;
  iban: string | null;
  description: string | null;
}

export interface ParseDocumentOptions {
  dataUrl: string;
  filename: string;
  lang: "it" | "en";
}