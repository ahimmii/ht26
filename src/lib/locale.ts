import { cookies } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("locale")?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getTrackingConsent() {
  const store = await cookies();
  return store.get("tracking_consent")?.value ?? null;
}
