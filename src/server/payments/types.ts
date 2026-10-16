import type { EventSettings, Order } from "@prisma/client";

export type PaymentInitiation =
  | {
      kind: "redirect";
      provider: "CMI";
      url: string;
      method: "POST";
      fields: Record<string, string>;
    }
  | {
      kind: "redirect";
      provider: "STRIPE";
      url: string;
      method: "GET";
      fields: Record<string, string>;
      externalId?: string;
    }
  | {
      kind: "instructions";
      provider: "MANUAL";
      orderReference: string;
    };

export type PaymentVerification =
  | { ok: true; orderReference: string; externalId: string }
  | { ok: false; reason: string };

export interface PaymentProvider {
  id: "CMI" | "MANUAL" | "STRIPE";
  enabled(): boolean;
  initiate(order: Order, event: EventSettings): Promise<PaymentInitiation>;
}

export { PAYABLE_STATUSES, isPayableStatus, assertNotClientRedirectConfirmation } from "@/lib/payment-rules";
export type { PayableStatus } from "@/lib/payment-rules";
