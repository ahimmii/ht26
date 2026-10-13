import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { getLocale } from "@/lib/locale";

export const instant = false;

export default async function VerifyPage() {
  const locale = await getLocale();
  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-32">
        <p className="eyebrow">Ticket verification</p>
        <h1 className="font-serif mt-4 text-5xl">One entry. One scan.</h1>
        <p className="mt-6 text-lg text-mist">
          Digital tickets are verified at the door by authorized staff. Each QR code is valid
          once. Guests can open the ticket link from their confirmation email or download the PDF.
          Staff use the protected scanner at /staff/scanner — the validation API is not public.
        </p>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
