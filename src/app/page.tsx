import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { getDictionary } from "@/lib/i18n-dictionary";
import { getLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";
import { pickLocalized } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { getEventAvailability } from "@/server/event";

export const instant = false;

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { event, remaining } = await getEventAvailability();

  return (
    <div>
      <SiteHeader locale={locale} />
      <Hero
        locale={locale}
        title={pickLocalized(locale, event.title, event.titleFr)}
        tagline={pickLocalized(locale, event.tagline, event.taglineFr)}
        dateLine={t.hero.dateLine}
        eventDate={event.date.toISOString()}
        priceCents={event.ticketPriceCents}
        currency={event.currency}
        capacity={event.capacity}
      />

      <section id="event" className="mx-auto max-w-6xl px-5 py-28">
        <div className="blood-line mb-16" />
        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <p className="eyebrow">Manifesto</p>
            <h2 className="font-serif mt-6 text-4xl md:text-6xl">
              {pickLocalized(locale, event.tagline, event.taglineFr)}
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-8 text-mist">
            {pickLocalized(locale, event.description, event.descriptionFr)}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-28 md:grid-cols-3">
        {[
          [locale === "fr" ? "Date" : "Date", formatDate(event.date, locale)],
          [locale === "fr" ? "Lieu" : "Venue", pickLocalized(locale, event.venue, event.venueFr)],
          [t.tickets.remaining, `${remaining} / ${event.capacity}`],
        ].map(([label, value]) => (
          <div key={label} className="border-t border-white/10 pt-6">
            <p className="eyebrow">{label}</p>
            <p className="font-serif mt-4 text-2xl">{value}</p>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden px-5 py-28">
        <div className="fog opacity-60" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">General admission</p>
            <h2 className="display-title mt-6 text-5xl md:text-7xl">
              {formatMoney(event.ticketPriceCents, event.currency)}
            </h2>
            <p className="mt-4 max-w-md text-mist">{t.tickets.subtitle}</p>
          </div>
          <Link href="/tickets" className="btn-blood">
            {t.hero.buy}
          </Link>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </div>
  );
}
