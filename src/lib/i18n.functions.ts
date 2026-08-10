import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Lang } from "./i18n";

/**
 * Server-only: picks the initial language from the request's Accept-Language header.
 * Real browsers virtually always send this header; bots/crawlers/review tools often
 * don't, so a missing header defaults to English rather than Italian — a genuine
 * Italian visitor without the header is rare, and can still switch via the toggle.
 */
export const detectInitialLang = createServerFn({ method: "GET" }).handler(async () => {
  const header = getRequest().headers.get("accept-language");
  const first = header?.split(",")[0]?.trim().toLowerCase();
  const lang: Lang = first?.startsWith("it") ? "it" : "en";
  return lang;
});
