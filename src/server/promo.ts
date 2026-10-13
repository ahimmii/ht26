import "server-only";
import type { PromoCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applyDiscount } from "@/lib/money";

export class PromoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromoError";
  }
}

export async function findActivePromo(code: string) {
  const promo = await prisma.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!promo || !promo.active) return null;
  if (promo.expiresAt && promo.expiresAt < new Date()) return null;
  return promo;
}

export async function assertPromoUsable(promo: PromoCode, email?: string) {
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    throw new PromoError("This promo code has reached its usage limit");
  }
  if (email && promo.perCustomerLimit > 0) {
    const usedByCustomer = await prisma.order.count({
      where: {
        email: email.toLowerCase(),
        promoCodeId: promo.id,
        status: { in: ["PENDING", "PENDING_VERIFICATION", "PAID"] },
      },
    });
    if (usedByCustomer >= promo.perCustomerLimit) {
      throw new PromoError("You have already used this promo code");
    }
  }
}

export function priceWithPromo(
  unitPriceCents: number,
  quantity: number,
  promo?: PromoCode | null,
) {
  const subtotalCents = unitPriceCents * quantity;
  if (!promo) {
    return { subtotalCents, discountCents: 0, totalCents: subtotalCents };
  }
  const discounted = applyDiscount(subtotalCents, promo.type, promo.value);
  return { subtotalCents, ...discounted };
}
