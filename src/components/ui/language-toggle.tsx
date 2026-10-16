"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n";

export function LanguageToggle({ locale }: { locale: Locale }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => setLocale(locale === "en" ? "fr" : "en"))}
      className="ui-meta text-[0.72rem] uppercase text-mist"
    >
      {locale === "en" ? "FR" : "EN"}
    </button>
  );
}
