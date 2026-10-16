import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripeConfig } from "@/lib/env";
import { sha256 } from "@/lib/utils";
import { evaluateStripeCheckoutSession } from "@/lib/stripe-rules";
import { getStripeClient } from "@/server/payments/stripe";
import { confirmPaidOrder, markOrderFailed } from "@/server/orders";

export const instant = false;

function paymentIntentId(value: unknown) {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") {
    return value.id;
  }
  return null;
}

export async function POST(request: Request) {
  const config = getStripeConfig();
  const stripe = getStripeClient();
  if (!config || !stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, config.webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.async_payment_failed" &&
    event.type !== "checkout.session.expired"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const orderReference =
    (typeof session.client_reference_id === "string" && session.client_reference_id) ||
    (typeof session.metadata?.orderReference === "string" ? session.metadata.orderReference : null);

  if (
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "checkout.session.expired"
  ) {
    if (orderReference) {
      await markOrderFailed(orderReference, event.type);
    }
    return NextResponse.json({ received: true });
  }

  const verification = evaluateStripeCheckoutSession({
    paymentStatus: session.payment_status,
    sessionStatus: session.status,
    orderReference,
    sessionId: session.id,
    paymentIntent: paymentIntentId(session.payment_intent),
  });

  if (!verification.ok) {
    return NextResponse.json({ error: verification.reason }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { reference: verification.orderReference },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await prisma.paymentEvent.create({
    data: {
      orderId: order.id,
      provider: "STRIPE",
      type: event.type,
      payloadHash: sha256(session.id),
      success: true,
      note: verification.externalId,
    },
  });

  await confirmPaidOrder({
    orderId: order.id,
    source: "stripe_webhook",
    externalId: verification.externalId,
  });

  return NextResponse.json({ received: true });
}
