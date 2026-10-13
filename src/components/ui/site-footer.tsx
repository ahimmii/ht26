import Link from "next/link";
import { getDictionary } from "@/lib/i18n-dictionary";
import type { Locale } from "@/lib/i18n";
import { BrandMark } from "./brand-mark";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <footer className="border-t border-white/10 px-5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <BrandMark size="footer" />
          <p className="mt-3 text-sm text-mist">Tangier, Morocco</p>
        </div>
        <div className="flex flex-wrap gap-5 text-[0.72rem] uppercase tracking-[0.12em] text-mist">
          <Link href="/terms">{t.footer.terms}</Link>
          <Link href="/privacy">{t.footer.privacy}</Link>
          <Link href="/refund">{t.footer.refund}</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/verify">{locale === "fr" ? "Contrôle" : "Verify"}</Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs text-mist/70">
        © 2026 Halloween Tangier. {t.footer.rights}
      </p>
    </footer>
  );
}
