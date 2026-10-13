import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale";
import { formatDate } from "@/lib/utils";
import { getEventSettings } from "@/server/event";
import { buildQrPayload } from "@/server/tickets";

export const instant = false;

export default async function TicketViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const locale = await getLocale();
  const { token } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { token },
    include: { order: true },
  });
  if (!ticket || ticket.order.status !== "PAID") notFound();
  const event = await getEventSettings();
  const qr = await QRCode.toDataURL(buildQrPayload(ticket.token), {
    errorCorrectionLevel: "H",
    margin: 1,
    color: { dark: "#080808", light: "#F4EFE6" },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-md px-5 pb-24 pt-32 text-center">
        <p className="eyebrow">{event.title}</p>
        <h1 className="font-serif mt-4 text-4xl">{ticket.holderName}</h1>
        <p className="mt-3 text-mist">{formatDate(event.date, locale)}</p>
        <p className="mt-2 text-mist">{ticket.order.reference}</p>
        {/* QR is a generated data URL, not a remote asset */}
        <img src={qr} alt="Ticket QR code" className="mx-auto mt-10 w-64" />
        <p className="mt-6 font-display tracking-[0.2em]">{ticket.publicCode}</p>
        <p className="mt-4 text-sm text-mist">Valid for one entry only.</p>
        <Link href={`/api/tickets/pdf/${ticket.token}`} className="btn-blood mt-10">
          Download PDF
        </Link>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
