import "server-only";
import Stripe from "stripe";
import type { EventSettings, Order } from "@prisma/client";
import { getAppUrl, getStripeConfig, isStripeConfigured } from "@/lib/env";
import type { PaymentInitiation, PaymentProvider } from "./types";

let client: Stripe | null = null;

export function getStripeClient() {
  const config = getStripeConfig();
  if (!config) return null;
  if (!client) {
    client = new Stripe(config.secretKey);
  }
  return client;
}

export const stripeProvider: PaymentProvider = {
  id: "STRIPE",
  enabled() {
    return isStripeConfigured();
  },
  async initiate(order: Order, event: EventSettings): Promise<PaymentInitiation> {
    const stripe = getStripeClient();
    if (!stripe) {
      throw new Error("Stripe is not configured. Online card payment is disabled.");
    }
    if (order.totalCents < 50) {
      throw new Error("Stripe cannot charge this amount. Choose another payment method.");
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.email,
      client_reference_id: order.reference,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: event.currency.toLowerCase(),
            unit_amount: order.totalCents,
            product_data: {
              name: `${event.title} × ${order.quantity}`,
              description: `${order.quantity} general admission ticket${order.quantity > 1 ? "s" : ""}`,
            },
          },
        },
      ],
      success_url: `${appUrl}/orders/${order.reference}`,
      cancel_url: `${appUrl}/orders/${order.reference}/pending?canceled=1`,
      metadata: {
        orderId: order.id,
        orderReference: order.reference,
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return {
      kind: "redirect",
      provider: "STRIPE",
      url: session.url,
      method: "GET",
      fields: {},
      externalId: session.id,
    };
  },
};
