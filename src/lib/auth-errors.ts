import { isAuthError } from "@supabase/supabase-js";
import type { Translate, TranslationKey } from "@/lib/i18n";

const KNOWN_CODES = new Set<string>([
  "invalid_credentials",
  "email_not_confirmed",
  "user_already_exists",
  "weak_password",
  "over_email_send_rate_limit",
  "email_address_invalid",
  "same_password",
]);

/** Turns a Supabase auth error into a translated, user-facing message. */
export function authErrorMessage(error: unknown, t: Translate): string {
  if (isAuthError(error) && error.code && KNOWN_CODES.has(error.code)) {
    return t(`auth.error.${error.code}` as TranslationKey);
  }
  return t("auth.error");
}
