export type StripeSessionEvaluation =
  | { ok: true; orderReference: string; externalId: string }
  | { ok: false; reason: string };

export function evaluateStripeCheckoutSession(input: {
  paymentStatus?: string | null;
  sessionStatus?: string | null;
  orderReference?: string | null;
  sessionId?: string | null;
  paymentIntent?: string | null;
}): StripeSessionEvaluation {
  if (input.paymentStatus !== "paid") {
    return { ok: false, reason: "Stripe session is not paid" };
  }
  if (input.sessionStatus && input.sessionStatus !== "complete") {
    return { ok: false, reason: "Stripe session is not complete" };
  }
  if (!input.orderReference) {
    return { ok: false, reason: "Missing order reference" };
  }
  const externalId = input.paymentIntent || input.sessionId;
  if (!externalId) {
    return { ok: false, reason: "Missing Stripe payment id" };
  }
  return {
    ok: true,
    orderReference: input.orderReference,
    externalId: String(externalId),
  };
}
