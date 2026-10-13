"use server";

import { headers } from "next/headers";
import { checkoutSchema } from "@/lib/validations";
import { getClientIp } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { createCheckoutOrder, initiatePayment } from "@/server/orders";
import { InventoryError } from "@/server/inventory";
import { OrderError } from "@/server/orders";
import { PromoError } from "@/server/promo";

export async function checkoutAction(_: unknown, formData: FormData) {
  const ip = getClientIp(await headers());
  const limited = rateLimit(`checkout:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return { error: "Too many checkout attempts. Please wait a moment." };
  }

  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    quantity: formData.get("quantity"),
    paymentMethod: formData.get("paymentMethod"),
    promoCode: formData.get("promoCode") || "",
    acceptTerms: formData.get("acceptTerms") === "on" ? true : undefined,
    ambassadorCode: formData.get("ambassadorCode") || undefined,
    utmSource: formData.get("utmSource") || undefined,
    utmMedium: formData.get("utmMedium") || undefined,
    utmCampaign: formData.get("utmCampaign") || undefined,
    locale: formData.get("locale") || "en",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid checkout details" };
  }

  try {
    const { order } = await createCheckoutOrder(parsed.data);
    const initiation = await initiatePayment(order);

    if (initiation.kind === "redirect") {
      return {
        redirect: {
          url: initiation.url,
          method: initiation.method,
          fields: initiation.fields,
        },
      };
    }

    return { reference: order.reference, pending: true };
  } catch (error) {
    if (error instanceof InventoryError || error instanceof OrderError || error instanceof PromoError) {
      return { error: error.message };
    }
    throw error;
  }
}
