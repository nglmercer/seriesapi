/**
 * i18n – Locale resolution utilities
 *
 * Resolves the best-fit locale from the request's Accept-Language header
 * against the set of locales the API actually has data for.
 *
 * Priority: exact match → language-only match → default ("en")
 */

export const DEFAULT_LOCALE = "en";

/**
 * Parse Accept-Language header into a weighted list.
 * e.g. "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5"
 *   → [{ locale: "fr-CH", q: 1 }, { locale: "fr", q: 0.9 }, ...]
 */
export function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [DEFAULT_LOCALE];
  const locales = header
    .split(",")
    .map((part) => {
      const [locale, qPart] = part.trim().split(";q=");
      const q = qPart ? parseFloat(qPart) : 1.0;
      return { locale: locale?.trim(), q: isNaN(q) ? 1.0 : q };
    })
    .filter((e) => e.locale && e.locale !== "*")
    .sort((a, b) => b.q - a.q)
    .map((e) => e.locale as string);
  if (Array.isArray(locales) && locales.some((l) => typeof l === "string")) {
    return locales;
  }
  return [DEFAULT_LOCALE];
}

/**
 * Resolve the best locale from a header against an available set.
 * Falls back to DEFAULT_LOCALE if nothing matches.
 */
export function resolveLocale(
  header: string | null,
  available: Set<string>,
): string {
  const candidates = parseAcceptLanguage(header);

  for (const candidate of candidates) {
    // 1. Exact match (e.g. "pt-BR" in available)
    if (available.has(candidate)) return candidate;

    // 2. Language-only match (e.g. "pt" matches "pt-BR")
    const lang = candidate.split("-")[0];
    for (const a of available) {
      if (a === lang || a.startsWith(lang + "-")) return a;
    }
  }

  return available.has(DEFAULT_LOCALE) ? DEFAULT_LOCALE : [...available][0] ?? DEFAULT_LOCALE;
}

/**
 * Extract locale from a Bun Request.
 * Checks (in order):
 *   1. ?locale= query param
 *   2. Accept-Language header
 *   3. DEFAULT_LOCALE
 */
export function getLocaleFromRequest(
  req: Request,
  available: Set<string>,
): string {
  const url = new URL(req.url);
  const qLocale = url.searchParams.get("locale");
  if (qLocale && available.has(qLocale)) return qLocale;

  return resolveLocale(req.headers.get("accept-language"), available);
}

/**
 * Canonical list of supported locales used at startup.
 * Extend as you add translations.
 */
export const SUPPORTED_LOCALES = new Set([
  "en",   // English
  "es",   // Spanish
  "ja",   // Japanese
  "pt-BR",// Brazilian Portuguese
  "fr",   // French
  "de",   // German
  "ko",   // Korean
  "zh",   // Chinese (Simplified)
  "zh-TW",// Chinese (Traditional)
  "it",   // Italian
  "ru",   // Russian
  "ar",   // Arabic
  "tr",   // Turkish
  "pl",   // Polish
  "id",   // Indonesian
]);
