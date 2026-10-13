import { TicketPicker } from "@/components/tickets/ticket-picker";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { getLocale } from "@/lib/locale";
import { getEventAvailability } from "@/server/event";

export const instant = false;

export default async function TicketsPage() {
  const locale = await getLocale();
  const { event, remaining, salesOpen, soldOut } = await getEventAvailability();

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="px-5 pb-24 pt-32">
        <TicketPicker
          locale={locale}
          priceCents={event.ticketPriceCents}
          currency={event.currency}
          remaining={remaining}
          salesOpen={salesOpen}
          soldOut={soldOut}
        />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
