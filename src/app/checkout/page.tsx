import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { isCmiConfigured, isStripeConfigured } from "@/lib/env";
import { getLocale } from "@/lib/locale";
import { getEventAvailability } from "@/server/event";

export const instant = false;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ qty?: string }>;
}) {
  const locale = await getLocale();
  const { qty } = await searchParams;
  const quantity = Math.min(6, Math.max(1, Number(qty ?? 1) || 1));
  const { event } = await getEventAvailability();

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="px-5 pb-24 pt-32">
        <CheckoutForm
          locale={locale}
          quantity={quantity}
          unitPriceCents={event.ticketPriceCents}
          currency={event.currency}
          cmiEnabled={isCmiConfigured()}
          stripeEnabled={isStripeConfigured()}
        />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
