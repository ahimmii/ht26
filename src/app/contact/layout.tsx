import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { getLocale } from "@/lib/locale";

export const instant = false;

export default async function ContactLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      {children}
      <SiteFooter locale={locale} />
    </div>
  );
}
