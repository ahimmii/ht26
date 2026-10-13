import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTicketPdf } from "@/server/pdf";
import { getEventSettings } from "@/server/event";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const ticket = await prisma.ticket.findUnique({
    where: { token },
    include: { order: true },
  });
  if (!ticket || ticket.order.status !== "PAID") {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const event = await getEventSettings();
  const pdf = await buildTicketPdf({ order: ticket.order, ticket, event });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ticket.publicCode}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
