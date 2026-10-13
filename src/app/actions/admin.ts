"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { eventSettingsSchema, promoCodeSchema } from "@/lib/validations";
import { getClientIp } from "@/lib/utils";
import { writeAuditLog } from "@/server/audit";
import { requireRole } from "@/server/require-auth";
import { cancelOrder, confirmPaidOrder, refundOrder } from "@/server/orders";
import { sendTicketEmail } from "@/server/email";

async function adminContext() {
  const user = await requireRole(["ADMIN"]);
  const ip = getClientIp(await headers());
  return { user, ip };
}

export async function verifyOrderAction(orderId: string) {
  const { user, ip } = await adminContext();
  await confirmPaidOrder({
    orderId,
    source: "admin_verify",
    actorId: user.id,
    externalId: `admin:${orderId}`,
    ip,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}

export async function cancelOrderAction(orderId: string) {
  const { user, ip } = await adminContext();
  await cancelOrder(orderId, user.id, ip);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}

export async function refundOrderAction(orderId: string) {
  const { user, ip } = await adminContext();
  await refundOrder(orderId, user.id, ip);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}

export async function resendTicketsAction(orderId: string) {
  const { user, ip } = await adminContext();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { tickets: true },
  });
  if (!order || order.status !== "PAID" || order.tickets.length === 0) {
    throw new Error("Tickets can only be resent for paid orders");
  }
  await sendTicketEmail(order, order.tickets);
  await writeAuditLog({
    actorId: user.id,
    action: "RESEND_TICKETS",
    entity: "Order",
    entityId: order.id,
    metadata: { reference: order.reference },
    ip,
  });
}

export async function revokeTicketAction(ticketId: string) {
  const { user, ip } = await adminContext();
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: TicketStatus.REVOKED },
  });
  await writeAuditLog({
    actorId: user.id,
    action: "REVOKE_TICKET",
    entity: "Ticket",
    entityId: ticket.id,
    metadata: { publicCode: ticket.publicCode },
    ip,
  });
  revalidatePath("/admin/tickets");
}

export async function saveEventSettingsAction(formData: FormData): Promise<void> {
  const { user, ip } = await adminContext();
  const parsed = eventSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid event settings");
  }

  const data = parsed.data;
  await prisma.eventSettings.update({
    where: { id: "default" },
    data: {
      ...data,
      date: new Date(data.date),
      salesOpenAt: new Date(data.salesOpenAt),
      salesCloseAt: new Date(data.salesCloseAt),
      posterUrl: data.posterUrl || null,
      bankName: data.bankName || null,
      bankAccountName: data.bankAccountName || null,
      bankIban: data.bankIban || null,
      bankReferenceHint: data.bankReferenceHint || null,
      contactPhone: data.contactPhone || null,
      instagramUrl: data.instagramUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      metaPixelId: data.metaPixelId || null,
      gaMeasurementId: data.gaMeasurementId || null,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "UPDATE_EVENT",
    entity: "EventSettings",
    entityId: "default",
    ip,
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function savePromoAction(formData: FormData): Promise<void> {
  const { user, ip } = await adminContext();
  const parsed = promoCodeSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid promo code");
  }

  const data = parsed.data;
  await prisma.promoCode.upsert({
    where: { code: data.code },
    update: {
      type: data.type,
      value: data.value,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      perCustomerLimit: data.perCustomerLimit,
      active: data.active,
    },
    create: {
      code: data.code,
      type: data.type,
      value: data.value,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      perCustomerLimit: data.perCustomerLimit,
      active: data.active,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "UPSERT_PROMO",
    entity: "PromoCode",
    entityId: data.code,
    ip,
  });
  revalidatePath("/admin/promos");
}
