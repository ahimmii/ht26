export type Locale = "en" | "fr";

export const defaultLocale: Locale = "en";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "fr";
}

export function pickLocalized<T>(
  locale: Locale,
  en: T,
  fr: T,
) {
  return locale === "fr" ? fr : en;
}
