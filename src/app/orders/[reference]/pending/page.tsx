import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n-dictionary";
import { getLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";
import { getEventSettings } from "@/server/event";

export const instant = false;

export default async function PendingOrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { reference } = await params;
  const [order, event] = await Promise.all([
    prisma.order.findUnique({ where: { reference } }),
    getEventSettings(),
  ]);
  if (!order) notFound();

  if (order.status === "PAID") {
    return <meta httpEquiv="refresh" content={`0;url=/orders/${order.reference}`} />;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-32">
        {order.paymentMethod === "STRIPE" && order.status !== "FAILED" ? (
          <meta httpEquiv="refresh" content="3" />
        ) : null}
        <p className="eyebrow">{order.reference}</p>
        <h1 className="font-serif mt-4 text-5xl">{t.pending.title}</h1>
        <p className="mt-4 text-mist">{t.pending.body}</p>
        <p className="mt-8 text-sm uppercase tracking-[0.2em] text-mist">{order.status}</p>
        <p className="mt-3 font-serif text-3xl">{formatMoney(order.totalCents, event.currency)}</p>

        {order.paymentMethod === "MANUAL" ? (
          <div className="mt-12 space-y-4 border-t border-white/10 pt-8 text-mist">
            <p>{event.bankName}</p>
            <p>{event.bankAccountName}</p>
            <p>{event.bankIban}</p>
            <p>{event.bankReferenceHint} {order.reference}</p>
            <p className="text-xs">
              Tickets are generated only after an authorized admin confirms receipt of funds.
            </p>
          </div>
        ) : (
          <p className="mt-12 text-mist">
            If you completed an online payment, this page waits for a verified server-side confirmation.
            A browser redirect alone cannot mark the order as paid.
          </p>
        )}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
