import "server-only";
import type { Order } from "@prisma/client";
import type { PaymentInitiation, PaymentProvider } from "./types";

export const manualProvider: PaymentProvider = {
  id: "MANUAL",
  enabled() {
    return true;
  },
  async initiate(order: Order): Promise<PaymentInitiation> {
    return {
      kind: "instructions",
      provider: "MANUAL",
      orderReference: order.reference,
    };
  },
};
