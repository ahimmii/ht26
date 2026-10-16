import "server-only";
import { cmiProvider } from "./cmi";
import { manualProvider } from "./manual";
import { stripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";

const providers: Record<PaymentProvider["id"], PaymentProvider> = {
  CMI: cmiProvider,
  MANUAL: manualProvider,
  STRIPE: stripeProvider,
};

export function getPaymentProvider(id: PaymentProvider["id"]) {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Unknown payment provider: ${id}`);
  }
  if (!provider.enabled()) {
    throw new Error(`${id} payment is not available`);
  }
  return provider;
}

export function listEnabledPaymentMethods() {
  return (Object.values(providers) as PaymentProvider[])
    .filter((provider) => provider.enabled())
    .map((provider) => provider.id);
}
