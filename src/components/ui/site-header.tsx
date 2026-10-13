import Link from "next/link";
import { getDictionary } from "@/lib/i18n-dictionary";
import type { Locale } from "@/lib/i18n";
import { BrandMark } from "./brand-mark";
import { LanguageToggle } from "./language-toggle";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" aria-label="Halloweenn Tangier 2026">
          <BrandMark size="header" priority />
        </Link>
        <nav className="hidden items-center gap-8 text-[0.72rem] tracking-[0.12em] uppercase text-mist md:flex">
          <Link href="/#event">{t.nav.event}</Link>
          <Link href="/tickets">{t.nav.tickets}</Link>
          <Link href="/faq">{t.nav.faq}</Link>
          <Link href="/contact">{t.nav.contact}</Link>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageToggle locale={locale} />
          <Link href="/tickets" className="btn-ghost px-4 py-2 text-[0.6rem]">
            {t.nav.buy}
          </Link>
        </div>
      </div>
    </header>
  );
}
