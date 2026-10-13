import "server-only";
import { TicketStatus, type Order, type Prisma } from "@prisma/client";
import { generatePublicCode, generateTicketToken } from "@/lib/utils";

export { buildQrPayload, qrContainsPii, QR_PII_FIELDS } from "@/lib/ticket-rules";

export async function createTicketsForOrder(
  tx: Prisma.TransactionClient,
  order: Pick<Order, "id" | "customerName" | "quantity">,
) {
  const tickets = [];
  for (let i = 0; i < order.quantity; i += 1) {
    const ticket = await tx.ticket.create({
      data: {
        token: generateTicketToken(),
        publicCode: generatePublicCode(),
        orderId: order.id,
        holderName: order.customerName,
        status: TicketStatus.VALID,
      },
    });
    tickets.push(ticket);
  }
  return tickets;
}

export type ScanResult =
  | {
      outcome: "VALID";
      ticketId: string;
      holderName: string;
      publicCode: string;
      orderReference: string;
      checkedInAt: Date;
    }
  | {
      outcome: "ALREADY_USED" | "INVALID" | "DENIED";
      reason: string;
      holderName?: string;
      publicCode?: string;
      checkedInAt?: Date | null;
    };

export async function checkInTicket(
  tx: Prisma.TransactionClient,
  input: { token?: string; publicCode?: string; staffId: string },
): Promise<ScanResult> {
  const ticket = await tx.ticket.findFirst({
    where: input.token
      ? { token: input.token }
      : { publicCode: input.publicCode?.toUpperCase() },
    include: { order: true },
  });

  if (!ticket) {
    return { outcome: "INVALID", reason: "Ticket not found" };
  }

  if (
    ticket.order.status === "CANCELLED" ||
    ticket.order.status === "REFUNDED" ||
    ticket.status === "CANCELLED" ||
    ticket.status === "REFUNDED"
  ) {
    await tx.checkIn.create({
      data: {
        ticketId: ticket.id,
        staffId: input.staffId,
        result: "DENIED",
      },
    });
    return {
      outcome: "DENIED",
      reason: "Ticket is cancelled or refunded",
      holderName: ticket.holderName,
      publicCode: ticket.publicCode,
    };
  }

  if (ticket.status === "REVOKED") {
    await tx.checkIn.create({
      data: {
        ticketId: ticket.id,
        staffId: input.staffId,
        result: "DENIED",
      },
    });
    return {
      outcome: "DENIED",
      reason: "Ticket has been revoked",
      holderName: ticket.holderName,
      publicCode: ticket.publicCode,
    };
  }

  if (ticket.status === "USED") {
    await tx.checkIn.create({
      data: {
        ticketId: ticket.id,
        staffId: input.staffId,
        result: "ALREADY_USED",
      },
    });
    return {
      outcome: "ALREADY_USED",
      reason: "Ticket already used",
      holderName: ticket.holderName,
      publicCode: ticket.publicCode,
      checkedInAt: ticket.checkedInAt,
    };
  }

  const now = new Date();
  const claimed = await tx.ticket.updateMany({
    where: { id: ticket.id, status: TicketStatus.VALID },
    data: { status: TicketStatus.USED, checkedInAt: now },
  });

  if (claimed.count !== 1) {
    const latest = await tx.ticket.findUnique({ where: { id: ticket.id } });
    await tx.checkIn.create({
      data: {
        ticketId: ticket.id,
        staffId: input.staffId,
        result: "ALREADY_USED",
      },
    });
    return {
      outcome: "ALREADY_USED",
      reason: "Ticket already used",
      holderName: ticket.holderName,
      publicCode: ticket.publicCode,
      checkedInAt: latest?.checkedInAt,
    };
  }

  await tx.checkIn.create({
    data: {
      ticketId: ticket.id,
      staffId: input.staffId,
      result: "VALID",
    },
  });

  return {
    outcome: "VALID",
    ticketId: ticket.id,
    holderName: ticket.holderName,
    publicCode: ticket.publicCode,
    orderReference: ticket.order.reference,
    checkedInAt: now,
  };
}
