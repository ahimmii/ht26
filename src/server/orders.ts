import "server-only";
import { OrderStatus, PaymentMethod, TicketStatus, type Order } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOrderReference, sha256 } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validations";
import { writeAuditLog } from "./audit";
import { getEventSettings } from "./event";
import {
  confirmReservedInventory,
  releaseConfirmedInventory,
  releaseReservedInventory,
  reserveInventory,
} from "./inventory";
import { getPaymentProvider } from "./payments/registry";
import { isPayableStatus } from "./payments/types";
import { assertPromoUsable, findActivePromo, priceWithPromo } from "./promo";
import { createTicketsForOrder } from "./tickets";
import { sendTicketEmail } from "./email";

export class OrderError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

function buildIdempotencyKey(input: CheckoutInput) {
  if (input.idempotencyKey) return input.idempotencyKey;
  const window = Math.floor(Date.now() / (5 * 60 * 1000));
  return sha256(
    `${input.email.toLowerCase()}|${input.quantity}|${input.paymentMethod}|${input.promoCode ?? ""}|${window}`,
  );
}

export async function createCheckoutOrder(input: CheckoutInput) {
  const event = await getEventSettings();
  const now = new Date();
  if (now < event.salesOpenAt) {
    throw new OrderError("SALES_CLOSED", "Ticket sales have not opened yet");
  }
  if (now > event.salesCloseAt) {
    throw new OrderError("SALES_CLOSED", "Ticket sales are closed");
  }

  const promo = input.promoCode ? await findActivePromo(input.promoCode) : null;
  if (input.promoCode && !promo) {
    throw new OrderError("PROMO_INVALID", "This promo code is not valid");
  }
  if (promo) {
    await assertPromoUsable(promo, input.email);
  }

  const pricing = priceWithPromo(event.ticketPriceCents, input.quantity, promo);
  const expiresAt =
    input.paymentMethod === "MANUAL"
      ? new Date(now.getTime() + event.manualReservationHours * 60 * 60 * 1000)
      : new Date(now.getTime() + event.reservationMinutes * 60 * 1000);

  const idempotencyKey = buildIdempotencyKey(input);
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey },
  });
  if (existing && isPayableStatus(existing.status)) {
    return { order: existing, reused: true };
  }

  const order = await prisma.$transaction(async (tx) => {
    await reserveInventory(tx, input.quantity);
    return tx.order.create({
      data: {
        reference: generateOrderReference(),
        customerName: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone,
        quantity: input.quantity,
        unitPriceCents: event.ticketPriceCents,
        discountCents: pricing.discountCents,
        totalCents: pricing.totalCents,
        status:
          input.paymentMethod === "MANUAL"
            ? OrderStatus.PENDING_VERIFICATION
            : OrderStatus.PENDING,
        paymentMethod: input.paymentMethod as PaymentMethod,
        paymentProvider: input.paymentMethod,
        promoCodeId: promo?.id,
        ambassadorCode: input.ambassadorCode || null,
        utmSource: input.utmSource || null,
        utmMedium: input.utmMedium || null,
        utmCampaign: input.utmCampaign || null,
        locale: input.locale,
        expiresAt,
        idempotencyKey,
      },
    });
  });

  await prisma.paymentEvent.create({
    data: {
      orderId: order.id,
      provider: input.paymentMethod,
      type: "order_created",
      success: true,
    },
  });

  return { order, reused: false };
}

export async function initiatePayment(order: Order) {
  const event = await getEventSettings();
  const provider = getPaymentProvider(order.paymentMethod);
  const initiation = await provider.initiate(order, event);
  await prisma.paymentEvent.create({
    data: {
      orderId: order.id,
      provider: provider.id,
      type: "initiate",
      success: true,
    },
  });
  return initiation;
}

export async function confirmPaidOrder(input: {
  orderId?: string;
  reference?: string;
  source: "admin_verify" | "cmi_callback";
  actorId?: string;
  externalId?: string;
  ip?: string;
}) {
  if (input.source !== "admin_verify" && input.source !== "cmi_callback") {
    throw new OrderError("UNVERIFIED_SOURCE", "Payment source is not authorized");
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: input.orderId
        ? { id: input.orderId }
        : { reference: input.reference },
    });
    if (!order) {
      throw new OrderError("NOT_FOUND", "Order not found");
    }

    if (order.status === OrderStatus.PAID) {
      const tickets = await tx.ticket.findMany({ where: { orderId: order.id } });
      return { order, tickets, alreadyPaid: true };
    }

    if (!isPayableStatus(order.status)) {
      throw new OrderError("NOT_PAYABLE", `Order cannot be paid from status ${order.status}`);
    }

    if (input.externalId) {
      const existing = await tx.processedWebhook.findUnique({
        where: {
          provider_externalId: {
            provider: input.source,
            externalId: input.externalId,
          },
        },
      });
      if (existing) {
        const tickets = await tx.ticket.findMany({ where: { orderId: order.id } });
        return { order, tickets, alreadyPaid: true };
      }
      await tx.processedWebhook.create({
        data: {
          provider: input.source,
          externalId: input.externalId,
        },
      });
    }

    await confirmReservedInventory(tx, order.quantity);
    const tickets = await createTicketsForOrder(tx, order);
    const paid = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        paymentExternalId: input.externalId ?? order.paymentExternalId,
      },
    });

    if (order.promoCodeId) {
      await tx.promoCode.update({
        where: { id: order.promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.paymentEvent.create({
      data: {
        orderId: order.id,
        provider: input.source,
        type: "confirmed",
        success: true,
        note: input.externalId,
      },
    });

    return { order: paid, tickets, alreadyPaid: false };
  });

  if (!result.alreadyPaid) {
    await writeAuditLog({
      actorId: input.actorId,
      action: "VERIFY_PAYMENT",
      entity: "Order",
      entityId: result.order.id,
      metadata: { source: input.source, reference: result.order.reference },
      ip: input.ip,
    });
    await sendTicketEmail(result.order, result.tickets);
  }

  return result;
}

export async function expireUnpaidOrders(now = new Date()) {
  const expired = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.PENDING, OrderStatus.PENDING_VERIFICATION] },
      expiresAt: { lte: now },
    },
  });

  let released = 0;
  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: { in: [OrderStatus.PENDING, OrderStatus.PENDING_VERIFICATION] },
        },
        data: { status: OrderStatus.EXPIRED },
      });
      if (updated.count !== 1) return;
      await releaseReservedInventory(tx, order.quantity);
      await tx.paymentEvent.create({
        data: {
          orderId: order.id,
          provider: "system",
          type: "expired",
          success: true,
        },
      });
    });
    released += 1;
  }
  return { expired: released };
}

export async function cancelOrder(orderId: string, actorId?: string, ip?: string) {
  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: orderId } });
    if (!current) throw new OrderError("NOT_FOUND", "Order not found");
    if (current.status === OrderStatus.CANCELLED) return current;

    if (isPayableStatus(current.status)) {
      await releaseReservedInventory(tx, current.quantity);
    } else if (current.status === OrderStatus.PAID) {
      await releaseConfirmedInventory(tx, current.quantity);
      await tx.ticket.updateMany({
        where: { orderId: current.id },
        data: { status: TicketStatus.CANCELLED },
      });
    }

    return tx.order.update({
      where: { id: current.id },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
    });
  });

  await writeAuditLog({
    actorId,
    action: "CANCEL_ORDER",
    entity: "Order",
    entityId: order.id,
    metadata: { reference: order.reference },
    ip,
  });
  return order;
}

export async function refundOrder(orderId: string, actorId?: string, ip?: string) {
  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: orderId } });
    if (!current) throw new OrderError("NOT_FOUND", "Order not found");
    if (current.status !== OrderStatus.PAID) {
      throw new OrderError("NOT_PAID", "Only paid orders can be refunded");
    }
    await releaseConfirmedInventory(tx, current.quantity);
    await tx.ticket.updateMany({
      where: { orderId: current.id },
      data: { status: TicketStatus.REFUNDED },
    });
    return tx.order.update({
      where: { id: current.id },
      data: { status: OrderStatus.REFUNDED },
    });
  });

  await writeAuditLog({
    actorId,
    action: "REFUND_ORDER",
    entity: "Order",
    entityId: order.id,
    metadata: { reference: order.reference },
    ip,
  });
  return order;
}

export async function markOrderFailed(reference: string, note?: string) {
  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order || !isPayableStatus(order.status)) return order;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: { in: [OrderStatus.PENDING, OrderStatus.PENDING_VERIFICATION] } },
      data: { status: OrderStatus.FAILED },
    });
    if (updated.count === 1) {
      await releaseReservedInventory(tx, order.quantity);
      await tx.paymentEvent.create({
        data: {
          orderId: order.id,
          provider: "cmi",
          type: "failed",
          success: false,
          note,
        },
      });
    }
    return tx.order.findUnique({ where: { id: order.id } });
  });
}
