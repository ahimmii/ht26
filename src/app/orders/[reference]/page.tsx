import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n-dictionary";
import { getLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";

export const instant = false;

export default async function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { reference } = await params;
  const order = await prisma.order.findUnique({
    where: { reference },
    include: { tickets: true },
  });
  if (!order) notFound();
  if (order.status !== "PAID") {
    return (
      <meta httpEquiv="refresh" content={`0;url=/orders/${order.reference}/pending`} />
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-32">
        <p className="eyebrow">{order.reference}</p>
        <h1 className="font-serif mt-4 text-5xl">{t.confirmation.title}</h1>
        <p className="mt-4 text-mist">{t.confirmation.body}</p>
        <p className="mt-8 font-serif text-3xl">{formatMoney(order.totalCents)}</p>
        <ul className="mt-10 space-y-4">
          {order.tickets.map((ticket) => (
            <li key={ticket.id} className="flex items-center justify-between border-t border-white/10 pt-4">
              <span>{ticket.publicCode}</span>
              <Link href={`/tickets/view/${ticket.token}`} className="btn-ghost px-4 py-2">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
