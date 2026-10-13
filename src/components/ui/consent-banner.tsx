"use client";

import { useTransition } from "react";
import { setTrackingConsent } from "@/app/actions/consent";
import type { Locale } from "@/lib/i18n";

export function ConsentBanner({
  locale,
  consent,
}: {
  locale: Locale;
  consent: string | null;
}) {
  const [pending, start] = useTransition();
  if (consent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-void/95 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-mist">
          {locale === "fr"
            ? "Nous n'activons les outils d'analyse (Meta Pixel, Google Analytics) qu'après votre accord."
            : "We only load analytics (Meta Pixel, Google Analytics) after you consent."}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={pending}
            className="btn-ghost px-4 py-2"
            onClick={() => start(() => setTrackingConsent(false))}
          >
            {locale === "fr" ? "Refuser" : "Decline"}
          </button>
          <button
            type="button"
            disabled={pending}
            className="btn-blood px-4 py-2"
            onClick={() => start(() => setTrackingConsent(true))}
          >
            {locale === "fr" ? "Accepter" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
