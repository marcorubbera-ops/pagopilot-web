import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Lang } from "./i18n";

/** Server-only: picks the initial language from the request's Accept-Language header. */
export const detectInitialLang = createServerFn({ method: "GET" }).handler(async () => {
  const header = getRequest().headers.get("accept-language");
  const first = header?.split(",")[0]?.trim().toLowerCase();
  const lang: Lang = first && !first.startsWith("it") ? "en" : "it";
  return lang;
});
