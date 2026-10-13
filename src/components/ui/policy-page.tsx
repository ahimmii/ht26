import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { getLocale } from "@/lib/locale";

export async function PolicyPage({
  title,
  body,
  placeholder,
}: {
  title: string;
  body: string;
  placeholder?: boolean;
}) {
  const locale = await getLocale();
  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-32">
        {placeholder ? <p className="eyebrow">Organizer placeholder</p> : null}
        <h1 className="font-serif mt-4 text-5xl">{title}</h1>
        <div className="mt-10 space-y-5 whitespace-pre-line text-mist">{body}</div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
